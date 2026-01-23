// DTOs for bank statement import

import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsNumber, IsEnum, Allow } from 'class-validator';
import { Type } from 'class-transformer';

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  balance?: number;
  reference?: string;
  rawData: Record<string, string>;
}

export interface ImportPreviewResponse {
  filename: string;
  detectedFormat: string;
  detectedCurrency: string;
  totalTransactions: number;
  duplicatesFound: number;
  dateRange: {
    from: string;
    to: string;
  };
  transactions: ImportPreviewTransaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  };
}

export interface ImportPreviewTransaction {
  hash: string;
  originalDate: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  balance?: number;
  suggestedCategory?: {
    categoryId: string;
    categoryName: string;
    confidence: number; // 0-1 normalized
    reason?: string;
  };
  isDuplicate: boolean;
  duplicateOf?: string;
}

// Internal interface used during parsing
export interface ImportPreview {
  filename: string;
  bankFormat: string;
  currency: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  transactions: ParsedTransactionWithCategory[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    duplicatesFound: number;
  };
}

export interface ParsedTransactionWithCategory extends ParsedTransaction {
  hash: string; // Unique identifier for this transaction in the preview
  suggestedCategory?: {
    categoryId: string;
    categoryName: string;
    confidence: number; // 0-100
    reason?: string;
  };
  isDuplicate: boolean;
  duplicateOf?: string;
}

export class ImportFileDto {
  accountId: string;
  currency?: string;
  skipDuplicates?: boolean;
}

export class ConfirmImportDto {
  @IsString()
  accountId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmTransactionDto)
  transactions: ConfirmTransactionDto[];

  @IsOptional()
  @Allow()
  preview?: any; // Optional preview for merging data - Allow any structure
}

export class ConfirmTransactionDto {
  @IsOptional()
  @IsString()
  hash?: string;
  
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  skip?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  @IsString()
  suggestedCategoryId?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;
}

export class ImportResultDto {
  imported: number;
  skipped: number;
  errors: string[];
  transactionIds: string[];
}

// Bank format configurations
export interface BankFormatConfig {
  name: string;
  encoding?: string;
  delimiter?: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  balanceColumn?: string;
  referenceColumn?: string;
  dateFormat: string;
  skipRows?: number;
  headerRow?: number;
  // Detection patterns
  detectPatterns?: string[];
}

export const BANK_FORMATS: Record<string, BankFormatConfig> = {
  // Spanish Banks
  'santander_es': {
    name: 'Santander España',
    delimiter: ';',
    dateColumn: 'Fecha',
    descriptionColumn: 'Concepto',
    amountColumn: 'Importe',
    balanceColumn: 'Saldo',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: ['Santander', 'Fecha;Concepto;Importe'],
  },
  'bbva_es': {
    name: 'BBVA España',
    delimiter: ';',
    dateColumn: 'Fecha',
    descriptionColumn: 'Descripción',
    debitColumn: 'Cargo',
    creditColumn: 'Abono',
    balanceColumn: 'Saldo',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: ['BBVA', 'Fecha;Descripción;Cargo;Abono'],
  },
  'caixabank_es': {
    name: 'CaixaBank',
    delimiter: ';',
    dateColumn: 'Fecha Operación',
    descriptionColumn: 'Concepto',
    amountColumn: 'Importe',
    balanceColumn: 'Saldo',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: ['CaixaBank', 'Fecha Operación'],
  },
  'ing_es': {
    name: 'ING España',
    delimiter: ';',
    dateColumn: 'F. Valor',
    descriptionColumn: 'Descripción',
    amountColumn: 'Importe (€)',
    balanceColumn: 'Saldo (€)',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: ['ING', 'F. Valor'],
  },
  'sabadell_es': {
    name: 'Banco Sabadell',
    delimiter: ';',
    dateColumn: 'Fecha',
    descriptionColumn: 'Concepto',
    amountColumn: 'Importe',
    balanceColumn: 'Saldo',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: ['Sabadell', 'Fecha;Concepto;Importe;Saldo'],
  },
  // International Banks
  'revolut': {
    name: 'Revolut',
    delimiter: ',',
    dateColumn: 'Started Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    balanceColumn: 'Balance',
    dateFormat: 'YYYY-MM-DD',
    detectPatterns: ['Revolut', 'Started Date', 'Type,Product'],
  },
  'n26': {
    name: 'N26',
    delimiter: ',',
    dateColumn: 'Date',
    descriptionColumn: 'Payee',
    amountColumn: 'Amount (EUR)',
    balanceColumn: 'Account balance',
    dateFormat: 'YYYY-MM-DD',
    detectPatterns: ['N26', 'Date,Payee,Account number'],
  },
  'wise': {
    name: 'Wise (TransferWise)',
    delimiter: ',',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    balanceColumn: 'Running Balance',
    dateFormat: 'DD-MM-YYYY',
    detectPatterns: ['TransferWise', 'Wise', 'TransferWise ID'],
  },
  // Generic formats
  'generic_comma': {
    name: 'CSV Genérico (coma)',
    delimiter: ',',
    dateColumn: 'date',
    descriptionColumn: 'description',
    amountColumn: 'amount',
    dateFormat: 'YYYY-MM-DD',
    detectPatterns: [],
  },
  'generic_semicolon': {
    name: 'CSV Genérico (punto y coma)',
    delimiter: ';',
    dateColumn: 'fecha',
    descriptionColumn: 'descripcion',
    amountColumn: 'importe',
    dateFormat: 'DD/MM/YYYY',
    detectPatterns: [],
  },
};

// Category matching patterns
export interface CategoryPattern {
  pattern: RegExp;
  categoryName: string;
  categoryType: 'INCOME' | 'EXPENSE';
  priority: number;
}

export const DEFAULT_CATEGORY_PATTERNS: CategoryPattern[] = [
  // ============== INCOME PATTERNS (highest priority) ==============
  { pattern: /n[oó]mina|salary|payroll|sueldo|haberes/i, categoryName: 'Salario', categoryType: 'INCOME', priority: 100 },
  { pattern: /bizum de [a-záéíóúñ]/i, categoryName: 'Bizum Recibido', categoryType: 'INCOME', priority: 99 },
  { pattern: /transferencia de [a-záéíóúñ]/i, categoryName: 'Transferencias Recibidas', categoryType: 'INCOME', priority: 98 },
  { pattern: /pensión|pension|jubilaci[oó]n/i, categoryName: 'Salario', categoryType: 'INCOME', priority: 97 },
  { pattern: /dividendo|dividend|rendimiento|intereses cuenta/i, categoryName: 'Inversiones', categoryType: 'INCOME', priority: 80 },
  { pattern: /reembolso|refund|devoluci[oó]n/i, categoryName: 'Reembolsos', categoryType: 'INCOME', priority: 70 },
  { pattern: /premio|lotería|loteria|quiniela|primitiva/i, categoryName: 'Otros Ingresos', categoryType: 'INCOME', priority: 60 },
  
  // ============== BIZUM SENT (very high priority) ==============
  { pattern: /bizum a favor de/i, categoryName: 'Bizum Enviado', categoryType: 'EXPENSE', priority: 99 },
  
  // ============== TRANSFERS OUT ==============
  { pattern: /transferencia (inmediata )?a favor de/i, categoryName: 'Transferencias Enviadas', categoryType: 'EXPENSE', priority: 98 },
  { pattern: /n26 top-?up|n26 top up/i, categoryName: 'Transferencias Enviadas', categoryType: 'EXPENSE', priority: 97 },
  { pattern: /revolut/i, categoryName: 'Transferencias Enviadas', categoryType: 'EXPENSE', priority: 97 },
  
  // ============== GAMBLING/BETTING (before generic patterns) ==============
  { pattern: /daznbet|dazn.*bet|inpay a\/s|inpay/i, categoryName: 'Apuestas', categoryType: 'EXPENSE', priority: 97 },
  { pattern: /bet365|betfair|codere|sportium|luckia|william hill|bwin|pokerstars|888sport|casa.*apuestas|kirolbet|betway|unibet/i, categoryName: 'Apuestas', categoryType: 'EXPENSE', priority: 97 },
  { pattern: /tulotero|loteria nacional|loterias.*estado/i, categoryName: 'Apuestas', categoryType: 'EXPENSE', priority: 96 },
  
  // ============== SUBSCRIPTIONS (high priority) ==============
  { pattern: /apple\.com\/bill|apple\.com|itunes|app store/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /openai|chatgpt|gpt.*subscr/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /google play|play store/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /netflix|hbo|disney\+|disney plus|prime video|amazon prime|filmin|movistar\+/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 93 },
  { pattern: /spotify|apple music|youtube premium|youtube music|deezer|tidal|audible/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 93 },
  { pattern: /xbox.*live|playstation.*plus|nintendo|steam|epic games|game pass/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /dropbox|google one|icloud|onedrive|creative cloud|adobe/i, categoryName: 'Suscripciones', categoryType: 'EXPENSE', priority: 92 },
  
  // ============== CLOTHING (specific brands, high priority) ==============
  { pattern: /zalando|zala.*ndo.*pay|zala ndo pay/i, categoryName: 'Ropa', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /nike\b|adidas|puma|reebok|new balance|asics/i, categoryName: 'Ropa', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /zara\b|h&m|mango|primark|pull\s*&?\s*bear|bershka|stradivarius|massimo dutti|lefties|uniqlo|c&a|asos|about you|vinted/i, categoryName: 'Ropa', categoryType: 'EXPENSE', priority: 94 },
  
  // ============== SPORTS & CYCLING (specific) ==============
  { pattern: /decathlon/i, categoryName: 'Deportes', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /bicicletas gil|bici.*gil/i, categoryName: 'Deportes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /deporticket|last lap|lastlap|inscripci[oó]n.*carrera|carrera.*inscripci[oó]n/i, categoryName: 'Deportes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /ekoi|hp\*jcr ekoi|wiggle|chain reaction|bike-discount|mammoth/i, categoryName: 'Deportes', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /sport.*zone|sprinter|foot locker|jd sports/i, categoryName: 'Deportes', categoryType: 'EXPENSE', priority: 93 },
  
  // ============== PERSONAL CARE (specific, high priority) ==============
  { pattern: /barber[ií]a|barberia|la barberia de|peluquer[ií]a|peluqueria|salon de belleza|est[eé]tica|estetica|manicura|pedicura|depilaci[oó]n/i, categoryName: 'Cuidado Personal', categoryType: 'EXPENSE', priority: 96 },
  
  // ============== TRANSPORT - PUBLIC (very high priority) ==============
  { pattern: /app crtm|crtm\b|consorcio.*transportes|abono.*transporte|recarga.*abono/i, categoryName: 'Transporte Público', categoryType: 'EXPENSE', priority: 97 },
  { pattern: /metro\b|tmb\b|emt\b|renfe|cercan[ií]as|tussam|titsa|guaguas|autobuses|autobus/i, categoryName: 'Transporte Público', categoryType: 'EXPENSE', priority: 93 },
  
  // ============== TRANSPORT - TOLL ROADS ==============
  { pattern: /seitt|seitt r3|seitt r5|r3 r5|autopista.*peaje|via-t|viat|telepeaje/i, categoryName: 'Peajes', categoryType: 'EXPENSE', priority: 95 },
  
  // ============== TAXI/VTC ==============
  { pattern: /uber\b(?!.*eats)|cabify|taxi|bolt\b|free now|freenow|blablacar/i, categoryName: 'Taxi/VTC', categoryType: 'EXPENSE', priority: 94 },
  
  // ============== GAS STATIONS ==============
  { pattern: /plenoil|plenergy/i, categoryName: 'Gasolina', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /us\s*\d{3}|gasolina|gasolinera|repsol|cepsa|bp\s|shell|galp|petrocat|ballenoil/i, categoryName: 'Gasolina', categoryType: 'EXPENSE', priority: 95 },
  
  // ============== RESTAURANTS & FOOD ==============
  { pattern: /mcdonald|mxc donald|mcd\b/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /vips\b/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /cafeteando/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /expstacruz/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /la promesa/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /tgtg|too good to go/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /cafeteria|cafetería|cafe\s|café\s|coffee/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 93 },
  { pattern: /restaurante|restaurant|asador|marisquer|taberna|mesón|meson|tasca/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /burger king|kfc|five guys|taco bell|wendy|subway/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /telepizza|dominos|domino's|pizza hut|papa johns|la tagliatella|ginos|foster.*hollywood/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /just eat|glovo|uber eats|deliveroo|pedidos ya|rappi/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 91 },
  { pattern: /starbucks|costa coffee|dunkin|tim hortons|100 montaditos/i, categoryName: 'Restaurantes', categoryType: 'EXPENSE', priority: 91 },
  
  // ============== FOOD & GROCERIES ==============
  { pattern: /mercadona/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /aldi\b/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /alcampo|mi alcampo/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /lidl\b/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /dia\s|dia$|\bdia\b/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /grupo sup.*ahorr|ahorramas|ahorram[aá]s/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 95 },
  { pattern: /carrefour|eroski|hipercor|consum|bonpreu|caprabo|condis|simply|supersol/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /supermercado|el corte.*supermercado|supercor|opencor/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 93 },
  { pattern: /queseria|queso|quesería de la nava/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /supermercado la\b/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /fruteria|fruterí|verdulería|verduleria|carnicer|pescader/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /panaderia|panaderí|pastelería|pasteleria|confitería/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 85 },
  { pattern: /licores|licoreria|licorer[ií]a|agujo/i, categoryName: 'Supermercado', categoryType: 'EXPENSE', priority: 85 },
  
  // ============== BILLS & UTILITIES ==============
  { pattern: /vodafone|movistar|orange|yoigo|digi\b|m[aá]sm[oó]vil|pepephone|lowi\b|o2\b|simyo|amena|jazztel|finetwork/i, categoryName: 'Teléfono/Internet', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /iberdrola|endesa|naturgy|gas natural|fenosa|eon\b|total.*energies/i, categoryName: 'Electricidad/Gas', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /canal de isabel|aguas de|cyii|emasesa|emasa|agbar/i, categoryName: 'Agua', categoryType: 'EXPENSE', priority: 94 },
  
  // ============== INSURANCE ==============
  { pattern: /seguro|insurance|mapfre|axa\b|allianz|zurich|mutua madrile[nñ]a|linea directa|pel[aá]yo|generali|santa luc[ií]a|occident|reale/i, categoryName: 'Seguros', categoryType: 'EXPENSE', priority: 92 },
  
  // ============== SHOPPING ==============
  { pattern: /aliexpress/i, categoryName: 'Compras Online', categoryType: 'EXPENSE', priority: 90 },
  { pattern: /rosa crema/i, categoryName: 'Compras Online', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /amazon(?!.*prime)|ebay|wish\b|temu|shein/i, categoryName: 'Compras Online', categoryType: 'EXPENSE', priority: 85 },
  { pattern: /pccomponentes|mediamarkt|fnac|worten|mielectro|mi electro/i, categoryName: 'Compras Online', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /el corte ingl[eé]s|eci\b/i, categoryName: 'Compras Online', categoryType: 'EXPENSE', priority: 80 },
  
  // ============== HOME & GARDEN ==============
  { pattern: /leroy merlin/i, categoryName: 'Hogar', categoryType: 'EXPENSE', priority: 94 },
  { pattern: /viveros|mayoral.*viveros|vierdes|helechos scm/i, categoryName: 'Hogar', categoryType: 'EXPENSE', priority: 93 },
  { pattern: /ikea|bricomart|bricodepot|aki\b|bauhaus|brico/i, categoryName: 'Hogar', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /garden|jardin|plantas/i, categoryName: 'Hogar', categoryType: 'EXPENSE', priority: 85 },
  
  // ============== HEALTH & WELLNESS ==============
  { pattern: /farmacia|pharmacy|parafarmacia|promofarma|lomel[ií]/i, categoryName: 'Farmacia', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /m[eé]dico|doctor|hospital|cl[ií]nica(?!.*veterinaria)|dentista|[oó]ptica|oftalm|dermat|fisio|quiropr/i, categoryName: 'Salud', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /adeslas|sanitas|dkv|asisa|caser.*salud|aegon.*salud/i, categoryName: 'Salud', categoryType: 'EXPENSE', priority: 90 },
  { pattern: /gimnasio|gym\b|fitness|basic fit|mcfit|dir\b|anytime fitness|o2 centro|metropolitan|holmes place/i, categoryName: 'Gimnasio', categoryType: 'EXPENSE', priority: 90 },
  
  // ============== HOUSING ==============
  { pattern: /pago comunidad|comunidad.*vecinos/i, categoryName: 'Comunidad', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /alquiler|rent\b|arrendamiento|mensualidad piso/i, categoryName: 'Alquiler', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /hipoteca|mortgage|pr[eé]stamo.*vivienda|amortizaci[oó]n/i, categoryName: 'Hipoteca', categoryType: 'EXPENSE', priority: 96 },
  { pattern: /comunidad|community fee|gastos comunes/i, categoryName: 'Comunidad', categoryType: 'EXPENSE', priority: 90 },
  
  // ============== ENTERTAINMENT ==============
  { pattern: /cine|cinema|kinepolis|yelmo|cinesa|mk2|ideal|renoir|verdi/i, categoryName: 'Cine', categoryType: 'EXPENSE', priority: 88 },
  { pattern: /teatro|concert|concierto|ticketmaster|eventbrite|fever/i, categoryName: 'Entretenimiento', categoryType: 'EXPENSE', priority: 87 },
  { pattern: /museo|exposici[oó]n|parque.*atracciones|zoo\b|acuario|warner|port aventura/i, categoryName: 'Entretenimiento', categoryType: 'EXPENSE', priority: 85 },
  
  // ============== FINANCE - VERY SPECIFIC (avoid matching "Comision 0,00") ==============
  { pattern: /comisi[oó]n(?! 0)|comision(?! 0)|commission|bank fee|mantenimiento.*cuenta|custodia|descubierto/i, categoryName: 'Comisiones Bancarias', categoryType: 'EXPENSE', priority: 85 },
  { pattern: /cajero|atm|cash withdrawal|retirada efectivo|disposici[oó]n/i, categoryName: 'Cajero', categoryType: 'EXPENSE', priority: 80 },
  
  // ============== EDUCATION ==============
  { pattern: /universidad|university|colegio|escuela|academia|instituto/i, categoryName: 'Educación', categoryType: 'EXPENSE', priority: 85 },
  { pattern: /curso|master\b|bootcamp|udemy|coursera|domestika|platzi|linkedin learning/i, categoryName: 'Educación', categoryType: 'EXPENSE', priority: 85 },
  { pattern: /libros|librer[ií]a|editorial|casa del libro/i, categoryName: 'Educación', categoryType: 'EXPENSE', priority: 80 },
  { pattern: /guarderia|guarder[ií]a|ludoteca|escuela infantil/i, categoryName: 'Educación', categoryType: 'EXPENSE', priority: 90 },
  
  // ============== TRAVEL ==============
  { pattern: /vueling|iberia|ryanair|easyjet|air europa|tap portugal|lufthansa|british airways|norwegian|level/i, categoryName: 'Viajes', categoryType: 'EXPENSE', priority: 90 },
  { pattern: /airbnb|booking\.com|booking\b|expedia|trivago|hotels\.com|hostel|albergue/i, categoryName: 'Viajes', categoryType: 'EXPENSE', priority: 90 },
  { pattern: /hotel\b|hostal|parador|pension/i, categoryName: 'Viajes', categoryType: 'EXPENSE', priority: 85 },
  
  // ============== PETS ==============
  { pattern: /veterinario|cl[ií]nica.*veterinaria|mascotas|tiendanimal|kiwoko|zooplus|petco/i, categoryName: 'Mascotas', categoryType: 'EXPENSE', priority: 88 },
  
  // ============== TAXES ==============
  { pattern: /agencia tributaria|hacienda|aeat|irpf|iva\b|ibi\b|impuesto.*bienes|catastro/i, categoryName: 'Impuestos', categoryType: 'EXPENSE', priority: 92 },
  { pattern: /multa|sanci[oó]n|dgt\b|ayuntamiento.*multa/i, categoryName: 'Impuestos', categoryType: 'EXPENSE', priority: 90 },
  
  // ============== CHARITY ==============
  { pattern: /donaci[oó]n|caritas|cruz roja|unicef|m[eé]dicos sin fronteras|ong\b|fundaci[oó]n/i, categoryName: 'Donaciones', categoryType: 'EXPENSE', priority: 85 },
  
  // ============== PARKING ==============
  { pattern: /parking|aparcamiento|parkimeter|empark|saba.*parking|aena.*parking|eysa/i, categoryName: 'Parking', categoryType: 'EXPENSE', priority: 88 },
  
  // ============== VEHICLE ==============
  { pattern: /itv\b|inspecci[oó]n t[eé]cnica|taller.*mec[aá]nico|mec[aá]nico|reparaci[oó]n.*coche|neumatico|neum[aá]tico|autofit|norauto|midas/i, categoryName: 'Vehículo', categoryType: 'EXPENSE', priority: 88 },
];
