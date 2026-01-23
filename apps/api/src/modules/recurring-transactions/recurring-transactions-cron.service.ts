import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class RecurringTransactionsCronService {
  private readonly logger = new Logger(RecurringTransactionsCronService.name);

  constructor(
    private prisma: PrismaService,
    private recurringService: RecurringTransactionsService,
    private transactionsService: TransactionsService,
  ) {}

  // Run every day at 6:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processRecurringTransactions() {
    this.logger.log('Starting recurring transactions processing...');

    try {
      const dueTransactions = await this.recurringService.getDueTransactions();
      this.logger.log(`Found ${dueTransactions.length} due recurring transactions`);

      for (const recurring of dueTransactions) {
        try {
          // Only auto-create if autoConfirm is true
          if (recurring.autoConfirm) {
            // Create the actual transaction
            await this.transactionsService.create(recurring.userId, {
              accountId: recurring.accountId,
              categoryId: recurring.categoryId || undefined,
              type: recurring.type,
              amount: recurring.amount.toString(),
              currency: recurring.currency,
              description: `${recurring.description} (Recurrente)`,
              notes: recurring.notes || undefined,
              occurredAt: recurring.nextOccurrence.toISOString(),
            });

            this.logger.log(
              `Created transaction for recurring ID ${recurring.id}: ${recurring.description}`,
            );
          }

          // Update the recurring transaction
          await this.recurringService.markExecuted(recurring.id);

          // Create notification for non-auto-confirm
          if (!recurring.autoConfirm) {
            await this.createPendingNotification(recurring);
          }
        } catch (err: unknown) {
          const error = err as Error;
          this.logger.error(
            `Failed to process recurring transaction ${recurring.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Finished processing recurring transactions');
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Error in recurring transactions cron: ${error.message}`,
        error.stack,
      );
    }
  }

  // Run every day at 8:00 AM to send reminders
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendUpcomingReminders() {
    this.logger.log('Checking for upcoming transaction reminders...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find recurring transactions that need reminders
      const recurring = await this.prisma.recurringTransaction.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          notifyBeforeDays: { gt: 0 },
        },
        include: {
          account: true,
          category: true,
        },
      });

      for (const rec of recurring) {
        const reminderDate = new Date(rec.nextOccurrence);
        reminderDate.setDate(reminderDate.getDate() - rec.notifyBeforeDays);
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate.getTime() === today.getTime()) {
          await this.createReminderNotification(rec);
          this.logger.log(`Sent reminder for recurring ID ${rec.id}: ${rec.description}`);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Error sending reminders: ${error.message}`,
        error.stack,
      );
    }
  }

  private async createPendingNotification(recurring: any) {
    await this.prisma.notification.create({
      data: {
        userId: recurring.userId,
        type: 'INFO',
        title: 'Transacción recurrente pendiente',
        message: `La transacción "${recurring.description}" de ${recurring.amount}€ está pendiente de confirmación.`,
        payload: {
          recurringId: recurring.id,
          type: 'PENDING_RECURRING',
          amount: recurring.amount.toNumber(),
          accountId: recurring.accountId,
        },
      },
    });
  }

  private async createReminderNotification(recurring: any) {
    const daysText =
      recurring.notifyBeforeDays === 1
        ? 'mañana'
        : `en ${recurring.notifyBeforeDays} días`;

    await this.prisma.notification.create({
      data: {
        userId: recurring.userId,
        type: 'INFO',
        title: 'Próxima transacción recurrente',
        message: `La transacción "${recurring.description}" de ${recurring.amount}€ se ejecutará ${daysText}.`,
        payload: {
          recurringId: recurring.id,
          type: 'UPCOMING_RECURRING',
          amount: recurring.amount.toNumber(),
          scheduledDate: recurring.nextOccurrence.toISOString(),
        },
      },
    });
  }
}
