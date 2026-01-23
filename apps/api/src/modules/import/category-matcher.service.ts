import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParsedTransaction,
  ParsedTransactionWithCategory,
  CategoryPattern,
  DEFAULT_CATEGORY_PATTERNS,
} from './dto/import.dto';

// Mapeo de nombres de categoría a iconos y colores por defecto
const CATEGORY_DEFAULTS: Record<string, { icon: string; color: string }> = {
  // Ingresos
  'Salario': { icon: '💰', color: '#10b981' },
  'Otros Ingresos': { icon: '💵', color: '#22c55e' },
  'Inversiones': { icon: '📈', color: '#14b8a6' },
  'Reembolsos': { icon: '🔄', color: '#06b6d4' },
  'Bizum Recibido': { icon: '📲', color: '#22c55e' },
  'Transferencias Recibidas': { icon: '💸', color: '#10b981' },
  'Transferencias Enviadas': { icon: '💸', color: '#f97316' },
  // Alimentación
  'Supermercado': { icon: '🛒', color: '#f59e0b' },
  'Restaurantes': { icon: '🍽️', color: '#f97316' },
  // Transporte
  'Gasolina': { icon: '⛽', color: '#ef4444' },
  'Taxi/VTC': { icon: '🚕', color: '#f43f5e' },
  'Transporte Público': { icon: '🚇', color: '#8b5cf6' },
  'Parking': { icon: '🅿️', color: '#a855f7' },
  'Vehículo': { icon: '🚗', color: '#f97316' },
  'Peajes': { icon: '🛣️', color: '#64748b' },
  // Servicios
  'Teléfono/Internet': { icon: '📱', color: '#3b82f6' },
  'Electricidad/Gas': { icon: '💡', color: '#eab308' },
  'Agua': { icon: '💧', color: '#06b6d4' },
  'Suscripciones': { icon: '📺', color: '#ec4899' },
  'Seguros': { icon: '🛡️', color: '#6366f1' },
  // Compras
  'Compras Online': { icon: '📦', color: '#f97316' },
  'Ropa': { icon: '👕', color: '#d946ef' },
  'Hogar': { icon: '🏠', color: '#84cc16' },
  'Deportes': { icon: '🚴', color: '#14b8a6' },
  // Salud
  'Farmacia': { icon: '💊', color: '#22c55e' },
  'Salud': { icon: '🏥', color: '#10b981' },
  'Gimnasio': { icon: '🏋️', color: '#14b8a6' },
  'Cuidado Personal': { icon: '💇', color: '#d946ef' },
  // Vivienda
  'Alquiler': { icon: '🏠', color: '#64748b' },
  'Hipoteca': { icon: '🏦', color: '#475569' },
  'Comunidad': { icon: '🏢', color: '#94a3b8' },
  'Impuestos': { icon: '📋', color: '#dc2626' },
  // Ocio
  'Cine': { icon: '🎬', color: '#a855f7' },
  'Entretenimiento': { icon: '🎭', color: '#d946ef' },
  'Apuestas': { icon: '🎰', color: '#ef4444' },
  // Finanzas
  'Comisiones Bancarias': { icon: '🏦', color: '#ef4444' },
  'Cajero': { icon: '🏧', color: '#64748b' },
  'Transferencias': { icon: '↔️', color: '#3b82f6' },
  'Bizum Enviado': { icon: '📲', color: '#f97316' },
  // Educación
  'Educación': { icon: '📚', color: '#6366f1' },
  // Viajes
  'Viajes': { icon: '✈️', color: '#0ea5e9' },
  // Mascotas
  'Mascotas': { icon: '🐾', color: '#84cc16' },
  // Donaciones
  'Donaciones': { icon: '❤️', color: '#ec4899' },
  // Por defecto
  'Otros Gastos': { icon: '📝', color: '#94a3b8' },
};

@Injectable()
export class CategoryMatcherService {
  private readonly logger = new Logger(CategoryMatcherService.name);
  private patterns: CategoryPattern[] = DEFAULT_CATEGORY_PATTERNS;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Match categories for a list of transactions, creating missing categories automatically
   */
  async matchCategories(
    transactions: ParsedTransaction[],
    userId: string,
    autoCreateCategories: boolean = true,
  ): Promise<ParsedTransactionWithCategory[]> {
    // Load user's categories
    let userCategories = await this.prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isSystem: true },
        ],
        deletedAt: null,
      },
    });

    // Create category map
    const categoryMap = new Map<string, { id: string; name: string; type: string }>();
    for (const cat of userCategories) {
      categoryMap.set(cat.name.toLowerCase(), {
        id: cat.id,
        name: cat.name,
        type: cat.type,
      });
    }

    // If autoCreate enabled, find which categories need to be created
    if (autoCreateCategories) {
      const neededCategories = this.getNeededCategories(transactions, categoryMap);
      if (neededCategories.length > 0) {
        this.logger.log(`Creating ${neededCategories.length} missing categories for user ${userId}`);
        await this.createMissingCategories(userId, neededCategories);
        
        // Reload categories after creation
        userCategories = await this.prisma.category.findMany({
          where: {
            OR: [{ userId }, { isSystem: true }],
            deletedAt: null,
          },
        });
        
        // Rebuild map
        categoryMap.clear();
        for (const cat of userCategories) {
          categoryMap.set(cat.name.toLowerCase(), {
            id: cat.id,
            name: cat.name,
            type: cat.type,
          });
        }
      }
    }

    // Load user's previous transactions for learning
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        categoryId: { not: null },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 500, // Last 500 transactions for learning
    });

    // Build learned patterns from user history
    const learnedPatterns = this.buildLearnedPatterns(recentTransactions);

    // Match each transaction (include index for unique hash generation)
    return transactions.map((tx, index) => this.matchSingleTransaction(tx, categoryMap, learnedPatterns, index));
  }

  /**
   * Build patterns from user's transaction history
   */
  private buildLearnedPatterns(
    transactions: { description: string | null; category: { id: string; name: string; type: string } | null }[],
  ): Map<string, { categoryId: string; categoryName: string; count: number }> {
    const patterns = new Map<string, { categoryId: string; categoryName: string; count: number }>();

    for (const tx of transactions) {
      if (!tx.category || !tx.description) continue;

      // Extract key words from description
      const keywords = this.extractKeywords(tx.description);
      
      for (const keyword of keywords) {
        const existing = patterns.get(keyword);
        if (existing && existing.categoryId === tx.category.id) {
          existing.count++;
        } else if (!existing || existing.count < 3) {
          // Only override if not established pattern
          patterns.set(keyword, {
            categoryId: tx.category.id,
            categoryName: tx.category.name,
            count: 1,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract meaningful keywords from description
   */
  private extractKeywords(description: string): string[] {
    // Normalize and clean
    const clean = description
      .toLowerCase()
      .replace(/[0-9]+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .trim();

    // Split and filter short/common words
    const stopWords = new Set([
      'de', 'la', 'el', 'en', 'a', 'los', 'las', 'un', 'una', 'y', 'o', 'por', 'con',
      'para', 'es', 'del', 'al', 'se', 'su', 'the', 'a', 'an', 'and', 'or', 'to', 'of',
      'pago', 'compra', 'tarjeta', 'card', 'payment', 'purchase', 'fecha', 'ref',
    ]);

    return clean
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Match a single transaction to a category
   */
  private matchSingleTransaction(
    tx: ParsedTransaction,
    categoryMap: Map<string, { id: string; name: string; type: string }>,
    learnedPatterns: Map<string, { categoryId: string; categoryName: string; count: number }>,
    index: number = 0,
  ): ParsedTransactionWithCategory {
    let bestMatch: { categoryId: string; categoryName: string; confidence: number; reason?: string } | null = null;

    // 1. First try default patterns (highest priority)
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(tx.description)) {
        const category = this.findCategoryByName(categoryMap, pattern.categoryName);
        if (category) {
          const confidence = Math.min(95, pattern.priority);
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              categoryId: category.id,
              categoryName: category.name,
              confidence,
              reason: `Coincide con patrón: ${pattern.categoryName}`,
            };
          }
        }
      }
    }

    // 2. Try learned patterns from user history
    if (!bestMatch || bestMatch.confidence < 80) {
      const keywords = this.extractKeywords(tx.description);
      for (const keyword of keywords) {
        const learned = learnedPatterns.get(keyword);
        if (learned && learned.count >= 2) {
          const confidence = Math.min(85, 50 + learned.count * 10);
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              categoryId: learned.categoryId,
              categoryName: learned.categoryName,
              confidence,
              reason: `Aprendido de transacciones anteriores (${learned.count} veces)`,
            };
          }
        }
      }
    }

    // 3. If no match, suggest based on type
    if (!bestMatch) {
      const defaultCategory = tx.type === 'INCOME'
        ? this.findCategoryByName(categoryMap, 'Otros Ingresos') || this.findCategoryByName(categoryMap, 'Other Income')
        : this.findCategoryByName(categoryMap, 'Otros Gastos') || this.findCategoryByName(categoryMap, 'Other');

      if (defaultCategory) {
        bestMatch = {
          categoryId: defaultCategory.id,
          categoryName: defaultCategory.name,
          confidence: 20,
          reason: 'Categoría por defecto',
        };
      }
    }

    // Generate unique hash for this transaction (include index to ensure uniqueness)
    const hashInput = `${tx.date.toISOString()}-${tx.description}-${tx.amount}-${tx.type}-${index}`;
    const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, 16);

    return {
      ...tx,
      hash,
      suggestedCategory: bestMatch ? {
        categoryId: bestMatch.categoryId,
        categoryName: bestMatch.categoryName,
        confidence: bestMatch.confidence,
        reason: bestMatch.reason,
      } : undefined,
      isDuplicate: false,
    };
  }

  /**
   * Find category by name (case-insensitive, with fallbacks)
   */
  private findCategoryByName(
    categoryMap: Map<string, { id: string; name: string; type: string }>,
    name: string,
  ): { id: string; name: string; type: string } | null {
    // Exact match
    const exact = categoryMap.get(name.toLowerCase());
    if (exact) return exact;

    // Partial match
    for (const [key, value] of categoryMap.entries()) {
      if (key.includes(name.toLowerCase()) || name.toLowerCase().includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Get categories that need to be created based on pattern matches
   */
  private getNeededCategories(
    transactions: ParsedTransaction[],
    categoryMap: Map<string, { id: string; name: string; type: string }>,
  ): Array<{ name: string; type: 'INCOME' | 'EXPENSE' }> {
    const neededCategories = new Map<string, 'INCOME' | 'EXPENSE'>();

    for (const tx of transactions) {
      // Check which pattern matches
      for (const pattern of this.patterns) {
        if (pattern.pattern.test(tx.description)) {
          // Check if category exists
          if (!this.findCategoryByName(categoryMap, pattern.categoryName)) {
            neededCategories.set(pattern.categoryName, pattern.categoryType);
          }
          break; // Use first matching pattern
        }
      }
    }

    // Always ensure we have default categories
    const defaultCategories = [
      { name: 'Otros Ingresos', type: 'INCOME' as const },
      { name: 'Otros Gastos', type: 'EXPENSE' as const },
    ];

    for (const def of defaultCategories) {
      if (!this.findCategoryByName(categoryMap, def.name)) {
        neededCategories.set(def.name, def.type);
      }
    }

    return Array.from(neededCategories.entries()).map(([name, type]) => ({ name, type }));
  }

  /**
   * Create missing categories for a user
   */
  private async createMissingCategories(
    userId: string,
    categories: Array<{ name: string; type: 'INCOME' | 'EXPENSE' }>,
  ): Promise<void> {
    for (const cat of categories) {
      const defaults = CATEGORY_DEFAULTS[cat.name] || { 
        icon: cat.type === 'INCOME' ? '💵' : '📝', 
        color: cat.type === 'INCOME' ? '#22c55e' : '#94a3b8' 
      };

      try {
        await this.prisma.category.create({
          data: {
            userId,
            name: cat.name,
            type: cat.type,
            icon: defaults.icon,
            color: defaults.color,
            isSystem: false,
          },
        });
        this.logger.log(`Created category "${cat.name}" for user ${userId}`);
      } catch (error) {
        // Category might already exist (race condition)
        this.logger.warn(`Could not create category "${cat.name}": ${error}`);
      }
    }
  }

  /**
   * Check for duplicate transactions
   */
  async findDuplicates(
    transactions: ParsedTransactionWithCategory[],
    userId: string,
    accountId: string,
  ): Promise<ParsedTransactionWithCategory[]> {
    // Get existing transactions for the date range
    const minDate = new Date(Math.min(...transactions.map((t) => t.date.getTime())));
    const maxDate = new Date(Math.max(...transactions.map((t) => t.date.getTime())));
    
    // Expand range by 1 day on each side
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const existingTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        occurredAt: {
          gte: minDate,
          lte: maxDate,
        },
        deletedAt: null,
      },
    });

    // Create signature map for existing transactions
    const existingSignatures = new Set<string>();
    for (const tx of existingTransactions) {
      const sig = this.createSignature(
        tx.occurredAt,
        parseFloat(tx.amount.toString()),
        tx.description || '',
      );
      existingSignatures.add(sig);
    }

    // Mark duplicates
    return transactions.map((tx) => {
      const sig = this.createSignature(tx.date, tx.amount, tx.description);
      const isDuplicate = existingSignatures.has(sig);
      
      // Also check for similar transactions (same date + amount)
      const looseSig = this.createLooseSignature(tx.date, tx.amount);
const existingMatch = existingTransactions.find((e: { id: string; occurredAt: Date; amount: { toString: () => string }; description: string | null }) =>
        this.createLooseSignature(e.occurredAt, parseFloat(e.amount.toString())) === looseSig
      );

      return {
        ...tx,
        isDuplicate,
        duplicateOf: existingMatch?.id,
      };
    });
  }

  /**
   * Create a signature for duplicate detection
   */
  private createSignature(date: Date, amount: number, description: string): string {
    const dateStr = date.toISOString().split('T')[0];
    const cleanDesc = description.toLowerCase().replace(/\s+/g, '');
    return `${dateStr}|${amount.toFixed(2)}|${cleanDesc}`;
  }

  /**
   * Create a loose signature (date + amount only)
   */
  private createLooseSignature(date: Date, amount: number): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}|${amount.toFixed(2)}`;
  }
}
