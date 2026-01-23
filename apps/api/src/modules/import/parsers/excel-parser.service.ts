import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ParsedTransaction, BankFormatConfig, BANK_FORMATS } from '../dto/import.dto';

interface ExcelBankConfig {
  name: string;
  // Column mappings (0-indexed or column letter)
  dateColumn: number | string;
  descriptionColumn: number | string;
  amountColumn?: number | string;
  incomeColumn?: number | string;
  expenseColumn?: number | string;
  balanceColumn?: number | string;
  // Parse options
  headerRow: number; // 0-indexed row where headers are
  dateFormat: string;
  amountFormat: 'european' | 'american';
  // Sheet selection
  sheetIndex?: number;
  sheetName?: string;
}

// Excel format configurations for Spanish banks
const EXCEL_BANK_CONFIGS: Record<string, ExcelBankConfig> = {
  // Santander España - Excel format (formato típico descargado de banca online)
  // Columnas: Fecha | Fecha Valor | Concepto | Importe | Saldo
  santander_es_excel: {
    name: 'Santander España (Excel)',
    dateColumn: 0,           // Fecha operación
    descriptionColumn: 2,    // Concepto (columna C, índice 2)
    amountColumn: 3,         // Importe (columna D, índice 3)
    balanceColumn: 4,        // Saldo (columna E, índice 4)
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Santander format alternativo (con cabecera extendida)
  // A veces Santander tiene varias filas de cabecera
  santander_es_excel_v2: {
    name: 'Santander España (Excel v2)',
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 3,
    balanceColumn: 4,
    headerRow: 4, // Santander a veces tiene cabeceras más abajo
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Santander formato con columnas separadas ingreso/gasto
  santander_es_excel_v3: {
    name: 'Santander España (Excel v3)',
    dateColumn: 0,
    descriptionColumn: 1,
    incomeColumn: 2,
    expenseColumn: 3,
    balanceColumn: 4,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // BBVA España - Excel format
  bbva_es_excel: {
    name: 'BBVA España (Excel)',
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 3,
    balanceColumn: 4,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // BBVA format con fecha operación y valor
  bbva_es_excel_v2: {
    name: 'BBVA España (Excel v2)',
    dateColumn: 'A', // Fecha operación
    descriptionColumn: 'C', // Concepto
    amountColumn: 'D', // Importe
    balanceColumn: 'E', // Saldo
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // CaixaBank - Excel format
  caixabank_excel: {
    name: 'CaixaBank (Excel)',
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    balanceColumn: 3,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Sabadell - Excel format
  sabadell_excel: {
    name: 'Banco Sabadell (Excel)',
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 3,
    balanceColumn: 4,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // ING España - Excel format
  ing_es_excel: {
    name: 'ING España (Excel)',
    dateColumn: 0,
    descriptionColumn: 1,
    incomeColumn: 2,
    expenseColumn: 3,
    balanceColumn: 4,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Bankinter - Excel format
  bankinter_excel: {
    name: 'Bankinter (Excel)',
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 3,
    balanceColumn: 4,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Unicaja - Excel format
  unicaja_excel: {
    name: 'Unicaja (Excel)',
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    balanceColumn: 3,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Openbank - Excel format
  openbank_excel: {
    name: 'Openbank (Excel)',
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    balanceColumn: 3,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
  // Generic Excel format
  generic_excel: {
    name: 'Genérico (Excel)',
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    balanceColumn: 3,
    headerRow: 0,
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'european',
  },
};

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  /**
   * Parse an Excel file and extract transactions
   */
  parseFile(
    buffer: Buffer,
    filename: string,
    formatHint?: string,
  ): { transactions: ParsedTransaction[]; detectedFormat: string; detectedCurrency: string } {
    try {
      // Usar cellDates: true para convertir fechas Excel a objetos Date de JS
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      
      // Detect format
      const config = this.detectFormat(workbook, filename, formatHint);
      
      if (!config) {
        throw new Error('No se pudo detectar el formato del archivo Excel');
      }

      // Get the sheet
      const sheetName = config.sheetName || workbook.SheetNames[config.sheetIndex || 0];
      const sheet = workbook.Sheets[sheetName];
      
      if (!sheet) {
        throw new Error('No se encontró la hoja de cálculo');
      }

      // Convert to JSON
      // raw: true para obtener valores numéricos sin formatear (evita problemas con formato europeo)
      // Las fechas se manejan en parseDate() ya sea como Date objects o serial numbers
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        defval: '',
      }) as unknown[][];

      // Parse transactions
      const transactions = this.parseTransactions(data, config);
      const currency = this.detectCurrency(data, workbook);

      return {
        transactions,
        detectedFormat: config.name,
        detectedCurrency: currency,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error parsing Excel file: ${message}`);
      throw new Error(`Error al parsear el archivo Excel: ${message}`);
    }
  }

  /**
   * Detect the bank format from the Excel content
   */
  private detectFormat(
    workbook: XLSX.WorkBook,
    filename: string,
    formatHint?: string,
  ): ExcelBankConfig | null {
    // If format hint provided, use it
    if (formatHint && EXCEL_BANK_CONFIGS[formatHint]) {
      return EXCEL_BANK_CONFIGS[formatHint];
    }

    const lowerFilename = filename.toLowerCase();
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const firstRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 }).slice(0, 10);
    const content = firstRows.flat().join(' ').toLowerCase();
    
    // Log for debugging
    this.logger.debug(`Detecting format for: ${filename}`);
    this.logger.debug(`First rows content: ${content.substring(0, 200)}`);

    // Detect by filename or content - Santander
    if (lowerFilename.includes('santander') || content.includes('santander') || content.includes('banco santander')) {
      // Analizar las primeras filas para determinar la versión correcta
      const headerRow = firstRows[0] || [];
      const headerContent = headerRow.map(h => String(h || '').toLowerCase()).join(' ');
      
      this.logger.debug(`Santander header: ${headerContent}`);
      
      // Si tiene cabeceras específicas, detectar versión
      if (headerContent.includes('ingresos') || headerContent.includes('gastos')) {
        // Versión con columnas separadas para ingresos/gastos
        return EXCEL_BANK_CONFIGS.santander_es_excel_v3;
      }
      
      // Si la primera fila no parece una cabecera de datos, puede tener cabecera extendida
      if (!headerContent.includes('fecha') && !headerContent.includes('concepto')) {
        // Buscar en las siguientes filas
        for (let i = 1; i < 6; i++) {
          const row = firstRows[i] || [];
          const rowContent = row.map(h => String(h || '').toLowerCase()).join(' ');
          if (rowContent.includes('fecha') || rowContent.includes('concepto')) {
            // Encontrada la fila de cabecera real
            const config = { ...EXCEL_BANK_CONFIGS.santander_es_excel_v2 };
            config.headerRow = i;
            return config;
          }
        }
      }
      
      return EXCEL_BANK_CONFIGS.santander_es_excel;
    }
    
    // Detect by filename - otros bancos
    if (lowerFilename.includes('bbva')) {
      return EXCEL_BANK_CONFIGS.bbva_es_excel;
    }
    if (lowerFilename.includes('caixa') || lowerFilename.includes('lacaixa')) {
      return EXCEL_BANK_CONFIGS.caixabank_excel;
    }
    if (lowerFilename.includes('sabadell')) {
      return EXCEL_BANK_CONFIGS.sabadell_excel;
    }
    if (lowerFilename.includes('ing')) {
      return EXCEL_BANK_CONFIGS.ing_es_excel;
    }
    if (lowerFilename.includes('bankinter')) {
      return EXCEL_BANK_CONFIGS.bankinter_excel;
    }
    if (lowerFilename.includes('unicaja')) {
      return EXCEL_BANK_CONFIGS.unicaja_excel;
    }
    if (lowerFilename.includes('openbank')) {
      return EXCEL_BANK_CONFIGS.openbank_excel;
    }

    // Detect by content - otros bancos
    if (content.includes('bbva')) {
      return EXCEL_BANK_CONFIGS.bbva_es_excel;
    }
    if (content.includes('caixabank') || content.includes('la caixa')) {
      return EXCEL_BANK_CONFIGS.caixabank_excel;
    }
    if (content.includes('sabadell')) {
      return EXCEL_BANK_CONFIGS.sabadell_excel;
    }
    if (content.includes('ing direct') || content.includes('ing españa')) {
      return EXCEL_BANK_CONFIGS.ing_es_excel;
    }
    if (content.includes('bankinter')) {
      return EXCEL_BANK_CONFIGS.bankinter_excel;
    }

    // Default to generic
    return EXCEL_BANK_CONFIGS.generic_excel;
  }

  /**
   * Parse transactions from Excel data
   */
  private parseTransactions(data: unknown[][], config: ExcelBankConfig): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    
    // Skip header rows
    const startRow = config.headerRow + 1;
    
    this.logger.debug(`Parsing transactions starting from row ${startRow}`);
    this.logger.debug(`Config: dateCol=${config.dateColumn}, descCol=${config.descriptionColumn}, amountCol=${config.amountColumn || 'N/A'}, incomeCol=${config.incomeColumn || 'N/A'}, expenseCol=${config.expenseColumn || 'N/A'}`);

    for (let i = startRow; i < data.length; i++) {
      const row = data[i] as (string | number | Date | undefined)[];
      
      if (!row || row.length === 0) continue;

      try {
        const date = this.parseDate(row, config);
        const description = this.getDescription(row, config);
        const { amount, type } = this.parseAmount(row, config);
        const balance = this.getBalance(row, config);
        
        // Debug logging for first few rows
        if (i < startRow + 3) {
          this.logger.debug(`Row ${i}: raw=${JSON.stringify(row.slice(0, 6))}`);
          this.logger.debug(`Row ${i}: date=${date}, desc=${description?.substring(0, 30)}, amount=${amount}, type=${type}, balance=${balance}`);
        }

        if (!date || amount === 0) continue;

        transactions.push({
          date: new Date(date),
          description: description || 'Sin descripción',
          amount: Math.abs(amount),
          type,
          balance: balance !== undefined ? balance : undefined,
          rawData: {},
        });
      } catch {
        // Skip invalid rows
        continue;
      }
    }

    return transactions;
  }

  /**
   * Parse date from row
   */
  private parseDate(row: (string | number | Date | undefined)[], config: ExcelBankConfig): string | null {
    const colIndex = this.getColumnIndex(config.dateColumn);
    const value = row[colIndex];

    if (!value) return null;

    // If already a Date object
    if (value instanceof Date) {
      return this.formatDate(value);
    }

    // If string, try to parse
    if (typeof value === 'string') {
      // Try DD/MM/YYYY
      const parts = value.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        
        if (year < 100) year += 2000;
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // If Excel serial number
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    return null;
  }

  /**
   * Get description from row
   */
  private getDescription(row: (string | number | Date | undefined)[], config: ExcelBankConfig): string {
    const colIndex = this.getColumnIndex(config.descriptionColumn);
    const value = row[colIndex];
    return value?.toString().trim() || '';
  }

  /**
   * Parse amount from row
   */
  private parseAmount(
    row: (string | number | Date | undefined)[],
    config: ExcelBankConfig,
  ): { amount: number; type: 'INCOME' | 'EXPENSE' } {
    // If separate income/expense columns
    if (config.incomeColumn !== undefined && config.expenseColumn !== undefined) {
      const incomeIdx = this.getColumnIndex(config.incomeColumn);
      const expenseIdx = this.getColumnIndex(config.expenseColumn);
      
      const income = this.parseNumber(row[incomeIdx], config.amountFormat);
      const expense = this.parseNumber(row[expenseIdx], config.amountFormat);

      if (income > 0) {
        return { amount: income, type: 'INCOME' };
      }
      if (expense !== 0) {
        return { amount: Math.abs(expense), type: 'EXPENSE' };
      }
    }

    // Single amount column
    if (config.amountColumn !== undefined) {
      const colIndex = this.getColumnIndex(config.amountColumn);
      const value = this.parseNumber(row[colIndex], config.amountFormat);

      if (value > 0) {
        return { amount: value, type: 'INCOME' };
      }
      return { amount: Math.abs(value), type: 'EXPENSE' };
    }

    return { amount: 0, type: 'EXPENSE' };
  }

  /**
   * Get balance from row
   */
  private getBalance(row: (string | number | Date | undefined)[], config: ExcelBankConfig): number | undefined {
    if (config.balanceColumn === undefined) return undefined;
    
    const colIndex = this.getColumnIndex(config.balanceColumn);
    const value = row[colIndex];
    
    if (value === undefined || value === null || value === '') return undefined;
    
    return this.parseNumber(value, config.amountFormat);
  }

  /**
   * Parse number with European or American format
   */
  private parseNumber(value: unknown, format: 'european' | 'american'): number {
    if (value === undefined || value === null || value === '') return 0;

    if (typeof value === 'number') return value;

    const str = value.toString().trim();
    
    // Remove currency symbols and whitespace
    let cleaned = str.replace(/[€$£\s]/g, '');

    if (format === 'european') {
      // European: 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // American: 1,234.56 -> 1234.56
      cleaned = cleaned.replace(/,/g, '');
    }

    // Handle parentheses as negative (accounting format)
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Convert column identifier to index
   */
  private getColumnIndex(col: number | string): number {
    if (typeof col === 'number') return col;
    
    // Convert letter to index (A=0, B=1, etc.)
    const upper = col.toUpperCase();
    let index = 0;
    for (let i = 0; i < upper.length; i++) {
      index = index * 26 + (upper.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Detect currency from Excel content
   */
  private detectCurrency(data: unknown[][], workbook: XLSX.WorkBook): string {
    const content = data.flat().join(' ');
    
    if (content.includes('€') || content.includes('EUR')) return 'EUR';
    if (content.includes('$') || content.includes('USD')) return 'USD';
    if (content.includes('£') || content.includes('GBP')) return 'GBP';

    // Check sheet names or workbook properties
    const sheetContent = workbook.SheetNames.join(' ').toLowerCase();
    if (sheetContent.includes('eur')) return 'EUR';

    return 'EUR'; // Default for Spanish banks
  }

  /**
   * Get supported Excel formats
   */
  getSupportedFormats(): { id: string; name: string }[] {
    return Object.entries(EXCEL_BANK_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
    }));
  }
}
