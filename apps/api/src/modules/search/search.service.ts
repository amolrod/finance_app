import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: 'transaction' | 'account' | 'category' | 'budget' | 'tag';
  title: string;
  subtitle?: string;
  icon?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(userId: string, query: string, limit = 10): Promise<GlobalSearchResponse> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0, query };
    }

    const searchTerm = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Search in parallel
    const [transactions, accounts, categories, budgets, tags] = await Promise.all([
      this.searchTransactions(userId, searchTerm, limit),
      this.searchAccounts(userId, searchTerm, limit),
      this.searchCategories(userId, searchTerm, limit),
      this.searchBudgets(userId, searchTerm, limit),
      this.searchTags(userId, searchTerm, limit),
    ]);

    results.push(...transactions, ...accounts, ...categories, ...budgets, ...tags);

    // Sort by relevance (exact matches first, then by type priority)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm ? 0 : 1;
      const bExact = b.title.toLowerCase() === searchTerm ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      
      const typePriority = { transaction: 0, account: 1, category: 2, budget: 3, tag: 4 };
      return typePriority[a.type] - typePriority[b.type];
    });

    return {
      results: results.slice(0, limit),
      total: results.length,
      query,
    };
  }

  private async searchTransactions(userId: string, query: string, limit: number): Promise<SearchResult[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { description: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        account: { select: { name: true, currency: true } },
        category: { select: { name: true, icon: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      type: 'transaction' as const,
      title: t.description || 'Transacción',
      subtitle: `${t.type === 'EXPENSE' ? '-' : '+'}${t.amount.toString()} ${t.currency} • ${t.account.name}`,
      icon: t.category?.icon || (t.type === 'EXPENSE' ? 'minus-circle' : 'plus-circle'),
      url: `/dashboard/transactions?highlight=${t.id}`,
      metadata: {
        type: t.type,
        amount: t.amount.toString(),
        currency: t.currency,
        date: t.occurredAt,
        categoryName: t.category?.name,
      },
    }));
  }

  private async searchAccounts(userId: string, query: string, limit: number): Promise<SearchResult[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return accounts.map((a) => ({
      id: a.id,
      type: 'account' as const,
      title: a.name,
      subtitle: `${a.type} • ${a.currentBalance.toString()} ${a.currency}`,
      icon: a.icon || 'wallet',
      url: `/dashboard/accounts?id=${a.id}`,
      metadata: {
        balance: a.currentBalance.toString(),
        currency: a.currency,
        accountType: a.type,
      },
    }));
  }

  private async searchCategories(userId: string, query: string, limit: number): Promise<SearchResult[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return categories.map((c) => ({
      id: c.id,
      type: 'category' as const,
      title: c.name,
      subtitle: c.type,
      icon: c.icon || 'folder',
      url: `/dashboard/categories?id=${c.id}`,
      metadata: {
        categoryType: c.type,
        color: c.color,
      },
    }));
  }

  private async searchBudgets(userId: string, query: string, limit: number): Promise<SearchResult[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { name: true, icon: true } },
      },
      orderBy: { periodMonth: 'desc' },
      take: limit,
    });

    return budgets.map((b) => ({
      id: b.id,
      type: 'budget' as const,
      title: b.category?.name || 'Presupuesto',
      subtitle: `${b.spentAmount.toString()}/${b.limitAmount.toString()} • ${b.periodMonth}`,
      icon: b.category?.icon || 'pie-chart',
      url: `/dashboard/budgets?id=${b.id}`,
      metadata: {
        amount: b.limitAmount.toString(),
        spent: b.spentAmount.toString(),
        period: b.periodMonth,
      },
    }));
  }

  private async searchTags(userId: string, query: string, limit: number): Promise<SearchResult[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        userId,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return tags.map((t) => ({
      id: t.id,
      type: 'tag' as const,
      title: t.name,
      subtitle: 'Etiqueta',
      icon: 'tag',
      url: `/dashboard/transactions?tag=${t.id}`,
      metadata: {
        color: t.color,
      },
    }));
  }
}
