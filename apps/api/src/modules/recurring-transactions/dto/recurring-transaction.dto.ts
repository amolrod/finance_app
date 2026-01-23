import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, RecurrenceFrequency } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @ApiProperty({ description: 'Account ID for the transaction' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Category ID for the transaction' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'], description: 'Type of transaction' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Transaction amount (always positive)', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code (default: EUR)' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Transaction description', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    description: 'Recurrence frequency',
  })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({
    description: 'Day of month for monthly/quarterly/yearly (1-31)',
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Day of week for weekly/biweekly (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD), null for indefinite' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Auto-confirm transactions or require manual confirmation',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoConfirm?: boolean;

  @ApiPropertyOptional({
    description: 'Days before to send notification (0 = same day)',
    default: 1,
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  @IsOptional()
  notifyBeforeDays?: number;
}

export class UpdateRecurringTransactionDto {
  @ApiPropertyOptional({ description: 'Account ID for the transaction' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Category ID for the transaction' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'], description: 'Type of transaction' })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Transaction amount (always positive)', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Transaction description', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    description: 'Recurrence frequency',
  })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({
    description: 'Day of month for monthly/quarterly/yearly (1-31)',
    minimum: 1,
    maximum: 31,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Day of week for weekly/biweekly (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD), null for indefinite' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-confirm transactions or require manual confirmation',
  })
  @IsBoolean()
  @IsOptional()
  autoConfirm?: boolean;

  @ApiPropertyOptional({
    description: 'Days before to send notification (0 = same day)',
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  @IsOptional()
  notifyBeforeDays?: number;
}

export class RecurringTransactionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'], description: 'Filter by type' })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    description: 'Filter by frequency',
  })
  @IsEnum(RecurrenceFrequency)
  @IsOptional()
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
