import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CsvParserService } from './parsers/csv-parser.service';
import { ExcelParserService } from './parsers/excel-parser.service';
import { PdfParserService } from './parsers/pdf-parser.service';
import { CategoryMatcherService } from './category-matcher.service';
import {
  ImportPreviewResponse,
  ConfirmImportDto,
  ImportResultDto,
  ParsedTransactionWithCategory,
  ParsedTransaction,
} from './dto/import.dto';
import Decimal from 'decimal.js';

type FileType = 'csv' | 'excel' | 'pdf';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvParser: CsvParserService,
    private readonly excelParser: ExcelParserService,
    private readonly pdfParser: PdfParserService,
    private readonly categoryMatcher: CategoryMatcherService,
  ) {}

  /**
   * Preview a file import without saving
   */
  async previewImport(
    userId: string,
    accountId: string,
    fileBuffer: Buffer,
    filename: string,
    formatHint?: string,
  ): Promise<ImportPreviewResponse> {
    // Validate account belongs to user
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId, deletedAt: null },
    });

    if (!account) {
      throw new BadRequestException('Cuenta no encontrada');
    }

    // Detect file type and parse
    const fileType = this.detectFileType(filename);
    let transactions: ParsedTransaction[];
    let detectedFormat: string;
    let detectedCurrency: string;

    switch (fileType) {
      case 'excel':
        const excelResult = this.excelParser.parseFile(fileBuffer, filename, formatHint);
        transactions = excelResult.transactions;
        detectedFormat = excelResult.detectedFormat;
        detectedCurrency = excelResult.detectedCurrency;
        break;
      
      case 'pdf':
        const pdfResult = await this.pdfParser.parseFile(fileBuffer, filename, formatHint);
        transactions = pdfResult.transactions;
        detectedFormat = pdfResult.detectedFormat;
        detectedCurrency = pdfResult.detectedCurrency;
        break;
      
      case 'csv':
      default:
        const fileContent = fileBuffer.toString('utf-8');
        const csvResult = this.csvParser.parseFile(fileContent, formatHint);
        transactions = csvResult.transactions;
        detectedFormat = csvResult.format.name;
        detectedCurrency = csvResult.currency;
        break;
    }

    if (transactions.length === 0) {
      throw new BadRequestException('No se encontraron transacciones en el archivo');
    }

    this.logger.log(`Parsed ${transactions.length} transactions from ${filename} (${fileType})`);

    // Match categories
    let matchedTransactions = await this.categoryMatcher.matchCategories(transactions, userId);

    // Find duplicates
    matchedTransactions = await this.categoryMatcher.findDuplicates(
      matchedTransactions,
      userId,
      accountId,
    );

    // Calculate summary
    const summary = this.calculateSummary(matchedTransactions);
    const dateRange = this.getDateRange(matchedTransactions);

    // Transform transactions for frontend format
    const formattedTransactions = matchedTransactions.map(tx => ({
      ...tx,
      // Frontend expects originalDate as ISO string
      originalDate: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
      date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
      // Normalize confidence to 0-1 range for frontend
      suggestedCategory: tx.suggestedCategory ? {
        ...tx.suggestedCategory,
        confidence: tx.suggestedCategory.confidence / 100, // Convert 0-100 to 0-1
      } : undefined,
    }));

    return {
      filename,
      detectedFormat: detectedFormat,
      detectedCurrency: detectedCurrency || account.currency,
      totalTransactions: formattedTransactions.length,
      duplicatesFound: formattedTransactions.filter(t => t.isDuplicate).length,
      dateRange: {
        from: dateRange.from instanceof Date ? dateRange.from.toISOString() : dateRange.from,
        to: dateRange.to instanceof Date ? dateRange.to.toISOString() : dateRange.to,
      },
      transactions: formattedTransactions,
      summary: {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpense,
        netAmount: summary.totalIncome - summary.totalExpense,
      },
    };
  }

  /**
   * Detect file type from filename
   */
  private detectFileType(filename: string): FileType {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (['.xlsx', '.xls', '.xlsm', '.xlsb'].includes(ext)) {
      return 'excel';
    }
    if (ext === '.pdf') {
      return 'pdf';
    }
    return 'csv';
  }

  /**
   * Confirm and import transactions
   */
  async confirmImport(
    userId: string,
    dto: ConfirmImportDto,
  ): Promise<ImportResultDto> {
    // Validate account
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, deletedAt: null },
    });

    if (!account) {
      throw new BadRequestException('Cuenta no encontrada');
    }

    const result: ImportResultDto = {
      imported: 0,
      skipped: 0,
      errors: [],
      transactionIds: [],
    };

    // Build a map from preview transactions if available
    const previewMap = new Map<string, any>();
    if (dto.preview?.transactions) {
      for (const previewTx of dto.preview.transactions) {
        if (previewTx.hash) {
          previewMap.set(previewTx.hash, previewTx);
        }
      }
    }

    // Prepare transactions for batch insert
    const transactionsToCreate: Array<{
      userId: string;
      accountId: string;
      categoryId: string | null;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      status: 'COMPLETED';
      amount: Decimal;
      currency: string;
      description: string;
      notes: string;
      occurredAt: Date;
    }> = [];
    
    let totalBalanceChange = new Decimal(0);
    const budgetUpdates: Map<string, { amount: number; date: Date }[]> = new Map();

    // Process each transaction - prepare data
    for (const txDto of dto.transactions) {
      if (txDto.skip) {
        result.skipped++;
        continue;
      }

      // Merge preview data with user selections
      const previewTx = txDto.hash ? previewMap.get(txDto.hash) : null;
      
      const date = txDto.date || previewTx?.originalDate || previewTx?.date;
      const description = txDto.description || previewTx?.description;
      const amount = txDto.amount ?? previewTx?.amount;
      const type = txDto.type || previewTx?.type;
      
      const suggestedCategoryId = txDto.suggestedCategoryId || previewTx?.suggestedCategory?.categoryId;
      const confidence = txDto.confidence ?? previewTx?.suggestedCategory?.confidence ?? 0;

      if (!date || !description || amount === undefined || !type) {
        this.logger.warn('Transaction missing required data', { txDto, previewTx });
        result.errors.push(`Transacción incompleta: ${description || 'sin descripción'}`);
        result.skipped++;
        continue;
      }

      try {
        const categoryId = txDto.categoryId || 
          (suggestedCategoryId && confidence >= 50 ? suggestedCategoryId : null);

        const transactionDate = new Date(date);
        const amountDecimal = new Decimal(amount);
        
        transactionsToCreate.push({
          userId,
          accountId: dto.accountId,
          categoryId,
          type,
          status: 'COMPLETED',
          amount: amountDecimal,
          currency: account.currency,
          description,
          notes: txDto.notes || 'Importado desde extracto bancario',
          occurredAt: transactionDate,
        });

        // Calculate balance change
        const balanceChange = type === 'INCOME' 
          ? amountDecimal
          : amountDecimal.negated();
        totalBalanceChange = totalBalanceChange.plus(balanceChange);

        // Track budget updates
        if (type === 'EXPENSE' && categoryId) {
          if (!budgetUpdates.has(categoryId)) {
            budgetUpdates.set(categoryId, []);
          }
          budgetUpdates.get(categoryId)!.push({ amount, date: transactionDate });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        this.logger.error(`Error preparing transaction: ${message}`);
        result.errors.push(`Error en "${txDto.description}": ${message}`);
      }
    }

    // Execute batch insert in a transaction
    if (transactionsToCreate.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Batch create all transactions
          const created = await tx.transaction.createMany({
            data: transactionsToCreate,
          });
          result.imported = created.count;

          // Update account balance once
          await tx.account.update({
            where: { id: dto.accountId },
            data: {
              currentBalance: {
                increment: totalBalanceChange,
              },
            },
          });
        }, {
          timeout: 25000, // 25 second timeout for the transaction
        });

        // Update budgets outside the main transaction (less critical)
        for (const [categoryId, updates] of budgetUpdates.entries()) {
          for (const update of updates) {
            try {
              await this.updateBudget(userId, categoryId, update.amount, update.date);
            } catch (error) {
              // Log but don't fail the import for budget update errors
              this.logger.warn(`Budget update failed for category ${categoryId}:`, error);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        this.logger.error(`Batch import failed: ${message}`);
        throw new BadRequestException(`Error al importar transacciones: ${message}`);
      }
    }

    this.logger.log(
      `Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`,
    );

    return result;
  }

  /**
   * Update budget spent amount using the transaction date
   */
  private async updateBudget(
    userId: string,
    categoryId: string,
    amount: number,
    transactionDate: Date,
  ): Promise<void> {
    // Use the transaction date's month, not current month
    const transactionMonth = transactionDate.toISOString().slice(0, 7); // YYYY-MM

    const budget = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        periodMonth: transactionMonth,
      },
    });

    if (budget) {
      await this.prisma.budget.update({
        where: { id: budget.id },
        data: {
          spentAmount: {
            increment: new Decimal(amount),
          },
        },
      });
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(transactions: ParsedTransactionWithCategory[]) {
    let totalIncome = 0;
    let totalExpense = 0;
    let duplicatesFound = 0;

    for (const tx of transactions) {
      if (tx.isDuplicate) {
        duplicatesFound++;
      }
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += tx.amount;
      }
    }

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      duplicatesFound,
    };
  }

  /**
   * Get date range from transactions
   */
  private getDateRange(transactions: ParsedTransactionWithCategory[]) {
    const dates = transactions.map((t) => t.date.getTime());
    return {
      from: new Date(Math.min(...dates)),
      to: new Date(Math.max(...dates)),
    };
  }

  /**
   * Get supported bank formats
   */
  getSupportedFormats() {
    const csvFormats = this.csvParser.getSupportedFormats();
    const excelFormats = this.excelParser.getSupportedFormats();
    const pdfFormats = this.pdfParser.getSupportedFormats();

    return {
      csv: csvFormats,
      excel: excelFormats,
      pdf: pdfFormats,
      supportedExtensions: ['.csv', '.txt', '.xlsx', '.xls', '.pdf'],
    };
  }
}
