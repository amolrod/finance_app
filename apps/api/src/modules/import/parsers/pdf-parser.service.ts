import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import { ParsedTransaction } from '../dto/import.dto';

interface PdfBankConfig {
  name: string;
  // Patterns for extracting data
  transactionPattern: RegExp;
  dateGroup: number;
  descriptionGroup: number;
  amountGroup: number;
  balanceGroup?: number;
  // Optional patterns
  headerPattern?: RegExp;
  footerPattern?: RegExp;
  // Parse options
  dateFormat: 'DMY' | 'MDY' | 'YMD';
  amountFormat: 'european' | 'american';
}

// PDF format configurations for Spanish banks
const PDF_BANK_CONFIGS: Record<string, PdfBankConfig> = {
  // Santander España - PDF format
  santander_es_pdf: {
    name: 'Santander España (PDF)',
    // Pattern: DD/MM/YYYY  Concepto  -123,45  1.234,56
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Santander format alternativo (sin saldo)
  santander_es_pdf_v2: {
    name: 'Santander España (PDF v2)',
    // Pattern: DD/MM/YYYY  DD/MM/YYYY  Concepto  -123,45
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})$/gm,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // BBVA España - PDF format
  bbva_es_pdf: {
    name: 'BBVA España (PDF)',
    // Pattern: DD/MM/YYYY  Concepto  123,45  1.234,56
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // BBVA format con fecha valor
  bbva_es_pdf_v2: {
    name: 'BBVA España (PDF v2)',
    // Pattern: DD/MM  Concepto  DDMM  123,45-  1.234,56
    transactionPattern: /(\d{2}\/\d{2})\s+(.+?)\s+\d{4}\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2}[\-\+]?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // CaixaBank - PDF format
  caixabank_pdf: {
    name: 'CaixaBank (PDF)',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s*€?\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Sabadell - PDF format
  sabadell_pdf: {
    name: 'Banco Sabadell (PDF)',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 3,
    amountGroup: 4,
    balanceGroup: 5,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // ING España - PDF format
  ing_es_pdf: {
    name: 'ING España (PDF)',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Bankinter - PDF format
  bankinter_pdf: {
    name: 'Bankinter (PDF)',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    balanceGroup: 4,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Unicaja - PDF format
  unicaja_pdf: {
    name: 'Unicaja (PDF)',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Generic Spanish bank PDF
  generic_es_pdf: {
    name: 'Banco Español Genérico (PDF)',
    // Most Spanish banks use DD/MM/YYYY and European number format
    transactionPattern: /(\d{2}\/\d{2}\/(?:\d{2}|\d{4}))\s+(.{10,60}?)\s+([\-\+]?\d{1,3}(?:\.\d{3})*,\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
  // Alternative generic pattern
  generic_pdf: {
    name: 'Genérico (PDF)',
    transactionPattern: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([\-\+]?\d+[,\.]\d{2})/g,
    dateGroup: 1,
    descriptionGroup: 2,
    amountGroup: 3,
    dateFormat: 'DMY',
    amountFormat: 'european',
  },
};

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  /**
   * Parse a PDF file and extract transactions
   */
  async parseFile(
    buffer: Buffer,
    filename: string,
    formatHint?: string,
  ): Promise<{ transactions: ParsedTransaction[]; detectedFormat: string; detectedCurrency: string }> {
    try {
      // Extract text from PDF
      const data = await pdfParse(buffer);
      const text = data.text;

      this.logger.debug(`Extracted ${text.length} characters from PDF`);

      // Detect format
      const config = this.detectFormat(text, filename, formatHint);

      if (!config) {
        throw new Error('No se pudo detectar el formato del archivo PDF');
      }

      // Parse transactions
      const transactions = this.parseTransactions(text, config);
      const currency = this.detectCurrency(text);

      this.logger.log(`Parsed ${transactions.length} transactions from PDF using ${config.name}`);

      return {
        transactions,
        detectedFormat: config.name,
        detectedCurrency: currency,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error parsing PDF file: ${message}`);
      throw new Error(`Error al parsear el archivo PDF: ${message}`);
    }
  }

  /**
   * Detect the bank format from the PDF content
   */
  private detectFormat(text: string, filename: string, formatHint?: string): PdfBankConfig | null {
    // If format hint provided, use it
    if (formatHint && PDF_BANK_CONFIGS[formatHint]) {
      return PDF_BANK_CONFIGS[formatHint];
    }

    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Detect by filename first
    if (lowerFilename.includes('santander')) {
      return PDF_BANK_CONFIGS.santander_es_pdf;
    }
    if (lowerFilename.includes('bbva')) {
      return PDF_BANK_CONFIGS.bbva_es_pdf;
    }
    if (lowerFilename.includes('caixa') || lowerFilename.includes('lacaixa')) {
      return PDF_BANK_CONFIGS.caixabank_pdf;
    }
    if (lowerFilename.includes('sabadell')) {
      return PDF_BANK_CONFIGS.sabadell_pdf;
    }
    if (lowerFilename.includes('ing')) {
      return PDF_BANK_CONFIGS.ing_es_pdf;
    }
    if (lowerFilename.includes('bankinter')) {
      return PDF_BANK_CONFIGS.bankinter_pdf;
    }
    if (lowerFilename.includes('unicaja')) {
      return PDF_BANK_CONFIGS.unicaja_pdf;
    }

    // Detect by content
    if (lowerText.includes('santander') || lowerText.includes('banco santander')) {
      // Check for alternative format
      if (lowerText.includes('fecha operación') && lowerText.includes('fecha valor')) {
        return PDF_BANK_CONFIGS.santander_es_pdf_v2;
      }
      return PDF_BANK_CONFIGS.santander_es_pdf;
    }
    
    if (lowerText.includes('bbva')) {
      // Check for alternative format
      if (lowerText.includes('f.oper') || lowerText.includes('f.valor')) {
        return PDF_BANK_CONFIGS.bbva_es_pdf_v2;
      }
      return PDF_BANK_CONFIGS.bbva_es_pdf;
    }
    
    if (lowerText.includes('caixabank') || lowerText.includes('la caixa') || lowerText.includes('"la caixa"')) {
      return PDF_BANK_CONFIGS.caixabank_pdf;
    }
    
    if (lowerText.includes('sabadell') || lowerText.includes('banc sabadell')) {
      return PDF_BANK_CONFIGS.sabadell_pdf;
    }
    
    if (lowerText.includes('ing direct') || lowerText.includes('ing españa') || lowerText.includes('ing bank')) {
      return PDF_BANK_CONFIGS.ing_es_pdf;
    }
    
    if (lowerText.includes('bankinter')) {
      return PDF_BANK_CONFIGS.bankinter_pdf;
    }
    
    if (lowerText.includes('unicaja')) {
      return PDF_BANK_CONFIGS.unicaja_pdf;
    }

    // Try to detect Spanish bank format by content patterns
    if (lowerText.includes('nº cuenta') || lowerText.includes('extracto') || lowerText.includes('movimientos')) {
      return PDF_BANK_CONFIGS.generic_es_pdf;
    }

    // Try each config to find one that produces results
    const configsToTry = [
      PDF_BANK_CONFIGS.generic_es_pdf,
      PDF_BANK_CONFIGS.santander_es_pdf,
      PDF_BANK_CONFIGS.bbva_es_pdf,
      PDF_BANK_CONFIGS.generic_pdf,
    ];

    for (const config of configsToTry) {
      const pattern = new RegExp(config.transactionPattern.source, config.transactionPattern.flags);
      const matches = [...text.matchAll(pattern)];
      if (matches.length >= 2) {
        this.logger.debug(`Detected format by pattern matching: ${config.name}`);
        return config;
      }
    }

    // Default to generic
    return PDF_BANK_CONFIGS.generic_pdf;
  }

  /**
   * Parse transactions from PDF text using the detected format
   */
  private parseTransactions(text: string, config: PdfBankConfig): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    
    // Create a new regex instance to avoid stateful issues
    const pattern = new RegExp(config.transactionPattern.source, config.transactionPattern.flags);
    
    // Normalize text - remove extra whitespace but preserve structure
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/  +/g, ' ');

    let match: RegExpExecArray | null;
    const seenTransactions = new Set<string>();

    while ((match = pattern.exec(normalizedText)) !== null) {
      try {
        const dateStr = match[config.dateGroup]?.trim();
        const description = match[config.descriptionGroup]?.trim();
        const amountStr = match[config.amountGroup]?.trim();
        const balanceStr = config.balanceGroup ? match[config.balanceGroup]?.trim() : undefined;

        if (!dateStr || !amountStr) continue;

        const date = this.parseDate(dateStr, config.dateFormat);
        if (!date) continue;

        const { amount, type } = this.parseAmount(amountStr, config.amountFormat);
        if (amount === 0) continue;

        const balance = balanceStr ? this.parseNumber(balanceStr, config.amountFormat) : undefined;

        // Create unique key for deduplication within PDF
        const key = `${date}-${description}-${amount}`;
        if (seenTransactions.has(key)) continue;
        seenTransactions.add(key);

        transactions.push({
          date: new Date(date),
          description: this.cleanDescription(description || 'Sin descripción'),
          amount: Math.abs(amount),
          type,
          balance,
          rawData: {},
        });
      } catch {
        // Skip malformed matches
        continue;
      }
    }

    // Sort by date (oldest first)
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    return transactions;
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(dateStr: string, format: 'DMY' | 'MDY' | 'YMD'): string | null {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length < 2) return null;

    let day: number, month: number, year: number;

    switch (format) {
      case 'DMY':
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
        break;
      case 'MDY':
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
        break;
      case 'YMD':
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
        break;
      default:
        return null;
    }

    // Handle 2-digit years
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }

    // Validate
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Parse amount string to number and determine type
   */
  private parseAmount(
    amountStr: string,
    format: 'european' | 'american',
  ): { amount: number; type: 'INCOME' | 'EXPENSE' } {
    // Check for trailing sign (e.g., "123,45-")
    const hasTrailingMinus = amountStr.endsWith('-');
    const hasTrailingPlus = amountStr.endsWith('+');

    let cleaned = amountStr.replace(/[€$£\s\+]/g, '');
    
    // Handle trailing sign
    if (hasTrailingMinus || hasTrailingPlus) {
      cleaned = cleaned.slice(0, -1);
      if (hasTrailingMinus) {
        cleaned = '-' + cleaned;
      }
    }

    const amount = this.parseNumber(cleaned, format);

    if (amount > 0) {
      return { amount, type: 'INCOME' };
    }
    return { amount: Math.abs(amount), type: 'EXPENSE' };
  }

  /**
   * Parse number with European or American format
   */
  private parseNumber(str: string, format: 'european' | 'american'): number {
    let cleaned = str.replace(/[€$£\s]/g, '');

    if (format === 'european') {
      // European: 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // American: 1,234.56 -> 1234.56
      cleaned = cleaned.replace(/,/g, '');
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Clean up description text
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/\s+/g, ' ')
      .replace(/[\x00-\x1F]/g, '') // Remove control characters
      .trim()
      .substring(0, 500); // Limit length
  }

  /**
   * Detect currency from PDF content
   */
  private detectCurrency(text: string): string {
    const upperText = text.toUpperCase();
    
    // Check for explicit currency mentions
    if (upperText.includes('EUR') || text.includes('€')) return 'EUR';
    if (upperText.includes('USD') || text.includes('$')) return 'USD';
    if (upperText.includes('GBP') || text.includes('£')) return 'GBP';

    return 'EUR'; // Default for Spanish banks
  }

  /**
   * Get supported PDF formats
   */
  getSupportedFormats(): { id: string; name: string }[] {
    return Object.entries(PDF_BANK_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
    }));
  }
}
