import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TagsModule } from './modules/tags/tags.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { HealthModule } from './modules/health/health.module';
import { RecurringTransactionsModule } from './modules/recurring-transactions/recurring-transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { ImportModule } from './modules/import/import.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting (disabled for development - very high limits)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 1000, // 1000 requests per second (effectively disabled)
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 5000, // 5000 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 30000, // 30000 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Global modules
    EmailModule,

    // Feature modules
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TagsModule,
    BudgetsModule,
    RecurringTransactionsModule,
    NotificationsModule,
    InvestmentsModule,
    ExchangeRatesModule,
    ImportModule,
    SearchModule,
    HealthModule,
  ],
  providers: [
    // ThrottlerGuard DISABLED for development
    // Uncomment for production:
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
