import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import {
  ParsedTransaction,
  BankFormatConfig,
  BANK_FORMATS,
} from '../dto/import.dto';

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  /**
   * Parse a CSV file and return transactions
   */
  parseFile(
    content: string,
    formatHint?: string,
  ): { transactions: ParsedTransaction[]; format: BankFormatConfig; currency: string } {
    // Clean BOM and normalize line endings
    const cleanContent = this.cleanContent(content);
    
    // Detect format
    const format = formatHint 
      ? BANK_FORMATS[formatHint] 
      : this.detectFormat(cleanContent);
    
    if (!format) {
      throw new Error('No se pudo detectar el formato del archivo. Por favor, selecciona el formato manualmente.');
    }

    this.logger.log(`Detected format: ${format.name}`);

    // Parse CSV
    const records = this.parseCsv(cleanContent, format);
    
    // Detect currency from content or format
    const currency = this.detectCurrency(cleanContent, format);
    
    // Convert to transactions
    const transactions = this.convertToTransactions(records, format);

    return { transactions, format, currency };
  }

  /**
   * Clean file content (BOM, encoding issues)
   */
  private cleanContent(content: string): string {
    // Remove BOM
    let clean = content.replace(/^\uFEFF/, '');
    // Normalize line endings
    clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return clean;
  }

  /**
   * Detect bank format from file content
   */
  private detectFormat(content: string): BankFormatConfig | null {
    const firstLines = content.split('\n').slice(0, 10).join('\n').toLowerCase();
    
    // Check each format's detection patterns
    for (const [key, format] of Object.entries(BANK_FORMATS)) {
      if (format.detectPatterns && format.detectPatterns.length > 0) {
        for (const pattern of format.detectPatterns) {
          if (firstLines.includes(pattern.toLowerCase())) {
            this.logger.log(`Matched format ${key} with pattern: ${pattern}`);
            return format;
          }
        }
      }
    }

    // Try to auto-detect based on delimiter and headers
    const isComma = content.includes(',');
    const isSemicolon = content.includes(';');
    
    if (isSemicolon && !isComma) {
      return this.tryDetectByHeaders(content, ';');
    } else if (isComma) {
      return this.tryDetectByHeaders(content, ',');
    }

    // Fallback to generic
    return isSemicolon ? BANK_FORMATS['generic_semicolon'] : BANK_FORMATS['generic_comma'];
  }

  /**
   * Try to detect format by matching column headers
   */
  private tryDetectByHeaders(content: string, delimiter: string): BankFormatConfig | null {
    const firstLine = content.split('\n')[0];
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
    
    for (const [, format] of Object.entries(BANK_FORMATS)) {
      if (format.delimiter !== delimiter) continue;
      
      const dateCol = format.dateColumn.toLowerCase();
      const descCol = format.descriptionColumn.toLowerCase();
      
      const hasDate = headers.some(h => h.includes(dateCol) || dateCol.includes(h));
      const hasDesc = headers.some(h => h.includes(descCol) || descCol.includes(h));
      
      if (hasDate && hasDesc) {
        return format;
      }
    }
    
    return null;
  }

  /**
   * Parse CSV content using detected format
   */
  private parseCsv(content: string, format: BankFormatConfig): Record<string, string>[] {
    const options: {
      delimiter: string;
      columns: true;
      skip_empty_lines: boolean;
      trim: boolean;
      relax_column_count: boolean;
      skip_records_with_error: boolean;
    } = {
      delimiter: format.delimiter || ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      skip_records_with_error: true,
    };

    // Handle files with skip rows
    let processedContent = content;
    if (format.skipRows && format.skipRows > 0) {
      const lines = content.split('\n');
      processedContent = lines.slice(format.skipRows).join('\n');
    }

    try {
      return parse(processedContent, options) as Record<string, string>[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`CSV parse error: ${message}`);
      throw new Error(`Error al parsear el archivo CSV: ${message}`);
    }
  }

  /**
   * Detect currency from file content
   */
  private detectCurrency(content: string, format: BankFormatConfig): string {
    const upperContent = content.toUpperCase();
    
    // Check for explicit currency mentions
    if (upperContent.includes('EUR') || upperContent.includes('€')) return 'EUR';
    if (upperContent.includes('USD') || upperContent.includes('$')) return 'USD';
    if (upperContent.includes('GBP') || upperContent.includes('£')) return 'GBP';
    
    // Infer from bank
    if (format.name.includes('España') || format.name.includes('Spain')) return 'EUR';
    if (format.name.includes('Revolut') || format.name.includes('N26') || format.name.includes('Wise')) return 'EUR';
    
    return 'EUR'; // Default
  }

  /**
   * Convert parsed records to transaction objects
   */
  private convertToTransactions(
    records: Record<string, string>[],
    format: BankFormatConfig,
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    for (const record of records) {
      try {
        const transaction = this.recordToTransaction(record, format);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        this.logger.warn(`Skipping invalid record: ${message}`);
      }
    }

    // Sort by date (oldest first)
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    return transactions;
  }

  /**
   * Convert a single record to a transaction
   */
  private recordToTransaction(
    record: Record<string, string>,
    format: BankFormatConfig,
  ): ParsedTransaction | null {
    // Find the date column (flexible matching)
    const dateValue = this.findColumnValue(record, format.dateColumn);
    if (!dateValue) return null;

    // Parse date
    const date = this.parseDate(dateValue, format.dateFormat);
    if (!date || isNaN(date.getTime())) return null;

    // Find description
    const description = this.findColumnValue(record, format.descriptionColumn) || '';
    if (!description.trim()) return null;

    // Calculate amount
    let amount: number;
    if (format.amountColumn) {
      const amountValue = this.findColumnValue(record, format.amountColumn);
      amount = this.parseAmount(amountValue || '0');
    } else if (format.debitColumn && format.creditColumn) {
      const debit = this.parseAmount(this.findColumnValue(record, format.debitColumn) || '0');
      const credit = this.parseAmount(this.findColumnValue(record, format.creditColumn) || '0');
      amount = credit - debit;
    } else {
      return null;
    }

    // Skip zero amounts
    if (amount === 0) return null;

    // Get balance if available
    const balanceValue = format.balanceColumn 
      ? this.findColumnValue(record, format.balanceColumn) 
      : undefined;
    const balance = balanceValue ? this.parseAmount(balanceValue) : undefined;

    // Get reference if available
    const reference = format.referenceColumn 
      ? this.findColumnValue(record, format.referenceColumn) 
      : undefined;

    return {
      date,
      description: description.trim(),
      amount: Math.abs(amount),
      type: amount >= 0 ? 'INCOME' : 'EXPENSE',
      balance,
      reference: reference || undefined,
      rawData: record,
    };
  }

  /**
   * Find column value with flexible matching
   */
  private findColumnValue(record: Record<string, string>, columnName: string): string | null {
    // Exact match
    if (record[columnName] !== undefined) {
      return record[columnName];
    }

    // Case-insensitive match
    const lowerName = columnName.toLowerCase();
    for (const [key, value] of Object.entries(record)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
      // Partial match
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }

  /**
   * Parse date string according to format
   */
  private parseDate(dateStr: string, format: string): Date {
    const clean = dateStr.trim();
    
    // Try different format patterns
    if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
      const sep = format.includes('/') ? '/' : '-';
      const parts = clean.split(sep);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    
    if (format === 'YYYY-MM-DD') {
      const parts = clean.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }

    if (format === 'MM/DD/YYYY') {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }

    // Fallback to native parsing
    return new Date(clean);
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr || amountStr.trim() === '') return 0;

    let clean = amountStr.trim();
    
    // Remove currency symbols
    clean = clean.replace(/[€$£¥]/g, '');
    
    // Handle European format (1.234,56)
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        // European: 1.234,56
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // US: 1,234.56
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      // Could be decimal separator or thousand separator
      const commaPos = clean.indexOf(',');
      const afterComma = clean.substring(commaPos + 1);
      if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
        // Likely decimal: 1234,56
        clean = clean.replace(',', '.');
      } else {
        // Likely thousand: 1,234
        clean = clean.replace(',', '');
      }
    }

    // Remove spaces and other characters
    clean = clean.replace(/\s/g, '');

    const amount = parseFloat(clean);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Get list of supported formats
   */
  getSupportedFormats(): { key: string; name: string }[] {
    return Object.entries(BANK_FORMATS).map(([key, format]) => ({
      key,
      name: format.name,
    }));
  }
}
