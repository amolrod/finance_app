import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class TransactionAccountDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currency: string;
}

export class TransactionCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  icon: string | null;

  @ApiPropertyOptional()
  color: string | null;
}

export class TransactionTagDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  color: string | null;
}

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ description: 'Amount (decimal string)', example: '99.99' })
  amount: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Description' })
  description: string | null;

  @ApiPropertyOptional({ description: 'Notes' })
  notes: string | null;

  @ApiProperty({ description: 'Transaction date' })
  occurredAt: Date;

  @ApiPropertyOptional({ type: TransactionAccountDto, description: 'Source account' })
  account: TransactionAccountDto | null;

  @ApiPropertyOptional({ type: TransactionCategoryDto, description: 'Category' })
  category: TransactionCategoryDto | null;

  @ApiPropertyOptional({ type: TransactionAccountDto, description: 'Destination account (transfers)' })
  transferToAccount: { id: string; name: string } | null;

  @ApiPropertyOptional({ type: [TransactionTagDto], description: 'Tags' })
  tags?: TransactionTagDto[];

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total income in period' })
  totalIncome: string;

  @ApiProperty({ description: 'Total expenses in period' })
  totalExpense: string;

  @ApiProperty({ description: 'Net amount (income - expense)' })
  netAmount: string;
}
