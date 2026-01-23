import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class AccountResponseDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ description: 'Account name', example: 'My Checking Account' })
  name: string;

  @ApiProperty({ description: 'Account type', enum: AccountType })
  type: AccountType;

  @ApiProperty({ description: 'Currency code', example: 'EUR' })
  currency: string;

  @ApiProperty({ description: 'Initial balance', example: '1000.00' })
  initialBalance: string;

  @ApiProperty({ description: 'Current balance', example: '1500.50' })
  currentBalance: string;

  @ApiPropertyOptional({ description: 'Account color', example: '#3B82F6' })
  color: string | null;

  @ApiPropertyOptional({ description: 'Account icon', example: '🏦' })
  icon: string | null;

  @ApiProperty({ description: 'Is account archived' })
  isArchived: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class AccountListResponseDto {
  @ApiProperty({ type: [AccountResponseDto] })
  data: AccountResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class CurrencyBalanceDto {
  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Total balance in this currency' })
  balance: string;
}

export class AccountSummaryDto {
  @ApiProperty({ description: 'Total balance across all accounts' })
  totalBalance: string;

  @ApiProperty({ description: 'Number of active accounts' })
  accountCount: number;

  @ApiProperty({ type: [CurrencyBalanceDto], description: 'Balance by currency' })
  byCurrency: CurrencyBalanceDto[];
}
