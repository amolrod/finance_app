import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        payload: dto.payload || Prisma.JsonNull,
      },
    });
  }

  async findAll(userId: string, unreadOnly: boolean = false) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (unreadOnly) {
      where.readAt = null;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to most recent 50
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { marked: result.count };
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  }

  async deleteAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { deleted: result.count };
  }

  // Helper methods for creating specific notification types
  async createBudgetWarning(
    userId: string,
    categoryName: string,
    percentUsed: number,
    budgetId: string,
  ) {
    return this.create(userId, {
      type: NotificationType.BUDGET_WARNING,
      title: '⚠️ Alerta de Presupuesto',
      message: `Has gastado el ${percentUsed.toFixed(0)}% del presupuesto de "${categoryName}".`,
      payload: {
        budgetId,
        categoryName,
        percentUsed,
        threshold: 80,
      },
    });
  }

  async createBudgetExceeded(
    userId: string,
    categoryName: string,
    amountOver: number,
    budgetId: string,
  ) {
    return this.create(userId, {
      type: NotificationType.BUDGET_EXCEEDED,
      title: '🚨 Presupuesto Excedido',
      message: `Has superado el presupuesto de "${categoryName}" por ${amountOver.toFixed(2)}€.`,
      payload: {
        budgetId,
        categoryName,
        amountOver,
      },
    });
  }

  async createSystemNotification(userId: string, title: string, message: string) {
    return this.create(userId, {
      type: NotificationType.SYSTEM,
      title,
      message,
    });
  }

  async createInfoNotification(userId: string, title: string, message: string, payload?: Record<string, any>) {
    return this.create(userId, {
      type: NotificationType.INFO,
      title,
      message,
      payload,
    });
  }
}
