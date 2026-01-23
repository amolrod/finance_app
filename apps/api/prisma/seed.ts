import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const passwordHash = await argon2.hash('DemoPass123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      emailVerified: true,
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  // Create default categories
  const incomeCategories = [
    { name: 'Salary', icon: '💼', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#10b981' },
    { name: 'Investments', icon: '📈', color: '#14b8a6' },
    { name: 'Other Income', icon: '💰', color: '#06b6d4' },
  ];

  const expenseCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#f97316' },
    { name: 'Transportation', icon: '🚗', color: '#ef4444' },
    { name: 'Housing', icon: '🏠', color: '#8b5cf6' },
    { name: 'Utilities', icon: '💡', color: '#a855f7' },
    { name: 'Healthcare', icon: '🏥', color: '#ec4899' },
    { name: 'Entertainment', icon: '🎬', color: '#f43f5e' },
    { name: 'Shopping', icon: '🛒', color: '#e11d48' },
    { name: 'Education', icon: '📚', color: '#3b82f6' },
    { name: 'Subscriptions', icon: '📱', color: '#6366f1' },
    { name: 'Other Expenses', icon: '📋', color: '#64748b' },
  ];

  // Create income categories
  await prisma.category.createMany({
    data: incomeCategories.map((cat, i) => ({
      userId: user.id,
      name: cat.name,
      type: 'INCOME' as const,
      icon: cat.icon,
      color: cat.color,
      isSystem: true,
      sortOrder: i,
    })),
    skipDuplicates: true,
  });

  // Create expense categories
  await prisma.category.createMany({
    data: expenseCategories.map((cat, i) => ({
      userId: user.id,
      name: cat.name,
      type: 'EXPENSE' as const,
      icon: cat.icon,
      color: cat.color,
      isSystem: true,
      sortOrder: i,
    })),
    skipDuplicates: true,
  });

  console.log('✅ Created default categories');

  // Create demo accounts
  const accounts = [
    {
      name: 'Main Bank Account',
      type: 'BANK' as const,
      currency: 'EUR',
      initialBalance: '5000.00',
      icon: '🏦',
      color: '#3b82f6',
    },
    {
      name: 'Cash Wallet',
      type: 'CASH' as const,
      currency: 'EUR',
      initialBalance: '200.00',
      icon: '💵',
      color: '#22c55e',
    },
    {
      name: 'Credit Card',
      type: 'CREDIT_CARD' as const,
      currency: 'EUR',
      initialBalance: '0.00',
      icon: '💳',
      color: '#ef4444',
    },
    {
      name: 'Savings Account',
      type: 'SAVINGS' as const,
      currency: 'EUR',
      initialBalance: '10000.00',
      icon: '🐷',
      color: '#8b5cf6',
    },
  ];

  const createdAccounts: { [key: string]: string } = {};

  for (const acc of accounts) {
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        initialBalance: new Decimal(acc.initialBalance).toNumber(),
        currentBalance: new Decimal(acc.initialBalance).toNumber(),
        icon: acc.icon,
        color: acc.color,
      },
    });
    createdAccounts[acc.name] = account.id;
  }

  console.log('✅ Created demo accounts');

  // Create some demo tags
  const tags = [
    { name: 'Work', color: '#3b82f6' },
    { name: 'Personal', color: '#22c55e' },
    { name: 'Recurring', color: '#f97316' },
    { name: 'One-time', color: '#8b5cf6' },
    { name: 'Essential', color: '#ef4444' },
  ];

  for (const tag of tags) {
    await prisma.tag.create({
      data: {
        userId: user.id,
        name: tag.name,
        color: tag.color,
      },
    });
  }

  console.log('✅ Created demo tags');

  // Get categories for transactions
  const salaryCategory = await prisma.category.findFirst({
    where: { userId: user.id, name: 'Salary' },
  });

  const foodCategory = await prisma.category.findFirst({
    where: { userId: user.id, name: 'Food & Dining' },
  });

  const transportCategory = await prisma.category.findFirst({
    where: { userId: user.id, name: 'Transportation' },
  });

  const subscriptionsCategory = await prisma.category.findFirst({
    where: { userId: user.id, name: 'Subscriptions' },
  });

  // Create demo transactions for current and previous month
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Salary - current month
  if (salaryCategory) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: createdAccounts['Main Bank Account'],
        categoryId: salaryCategory.id,
        type: 'INCOME',
        amount: 3500,
        currency: 'EUR',
        description: 'Monthly Salary',
        occurredAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
      },
    });

    // Salary - last month
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: createdAccounts['Main Bank Account'],
        categoryId: salaryCategory.id,
        type: 'INCOME',
        amount: 3500,
        currency: 'EUR',
        description: 'Monthly Salary',
        occurredAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      },
    });
  }

  // Expenses
  const expenses = [
    {
      category: foodCategory,
      account: 'Credit Card',
      amount: '45.50',
      description: 'Grocery shopping',
      daysAgo: 2,
    },
    {
      category: foodCategory,
      account: 'Cash Wallet',
      amount: '12.00',
      description: 'Coffee with friends',
      daysAgo: 3,
    },
    {
      category: transportCategory,
      account: 'Main Bank Account',
      amount: '50.00',
      description: 'Monthly metro pass',
      daysAgo: 5,
    },
    {
      category: subscriptionsCategory,
      account: 'Credit Card',
      amount: '14.99',
      description: 'Netflix subscription',
      daysAgo: 10,
    },
    {
      category: subscriptionsCategory,
      account: 'Credit Card',
      amount: '9.99',
      description: 'Spotify subscription',
      daysAgo: 10,
    },
    {
      category: foodCategory,
      account: 'Credit Card',
      amount: '85.00',
      description: 'Restaurant dinner',
      daysAgo: 7,
    },
  ];

  for (const exp of expenses) {
    if (exp.category) {
      const occurredAt = new Date();
      occurredAt.setDate(occurredAt.getDate() - exp.daysAgo);

      await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: createdAccounts[exp.account],
          categoryId: exp.category.id,
          type: 'EXPENSE',
          amount: new Decimal(exp.amount).toNumber(),
          currency: 'EUR',
          description: exp.description,
          occurredAt,
        },
      });
    }
  }

  console.log('✅ Created demo transactions');

  // Update account balances
  const bankBalance = new Decimal('5000.00')
    .plus('3500.00') // Salary
    .minus('50.00'); // Metro pass

  await prisma.account.update({
    where: { id: createdAccounts['Main Bank Account'] },
    data: { currentBalance: bankBalance.toNumber() },
  });

  const cashBalance = new Decimal('200.00').minus('12.00');
  await prisma.account.update({
    where: { id: createdAccounts['Cash Wallet'] },
    data: { currentBalance: cashBalance.toNumber() },
  });

  const creditBalance = new Decimal('0.00')
    .minus('45.50')
    .minus('14.99')
    .minus('9.99')
    .minus('85.00');
  await prisma.account.update({
    where: { id: createdAccounts['Credit Card'] },
    data: { currentBalance: creditBalance.toNumber() },
  });

  console.log('✅ Updated account balances');

  // Create demo budgets
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (foodCategory) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: foodCategory.id,
        periodMonth,
        limitAmount: 300,
        spentAmount: 142.5, // 45.50 + 12.00 + 85.00
      },
    });
  }

  if (subscriptionsCategory) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: subscriptionsCategory.id,
        periodMonth,
        limitAmount: 50,
        spentAmount: 24.98, // 14.99 + 9.99
      },
    });
  }

  console.log('✅ Created demo budgets');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: DemoPass123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
