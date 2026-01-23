import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty({ description: 'Budget ID' })
  id: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Category icon' })
  categoryIcon: string | null;

  @ApiPropertyOptional({ description: 'Category color' })
  categoryColor: string | null;

  @ApiProperty({ description: 'Period month (YYYY-MM)' })
  periodMonth: string;

  @ApiProperty({ description: 'Budget limit' })
  limitAmount: string;

  @ApiProperty({ description: 'Amount spent' })
  spentAmount: string;

  @ApiProperty({ description: 'Remaining amount' })
  remainingAmount: string;

  @ApiProperty({ description: 'Percentage used (0-100)' })
  percentageUsed: number;

  @ApiProperty({ description: 'Alert at 80%' })
  alertAt80: boolean;

  @ApiProperty({ description: 'Alert at 100%' })
  alertAt100: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class BudgetStatusDto {
  @ApiProperty()
  budgetId: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiPropertyOptional()
  categoryIcon: string | null;

  @ApiPropertyOptional()
  categoryColor: string | null;

  @ApiProperty()
  limitAmount: string;

  @ApiProperty()
  spentAmount: string;

  @ApiProperty()
  remainingAmount: string;

  @ApiProperty({ description: 'Percentage used (0-100)' })
  percentageUsed: number;

  @ApiProperty({ description: 'Is over budget' })
  isOverBudget: boolean;

  @ApiProperty({ description: 'Is at warning threshold (80-99%)' })
  isWarning: boolean;
}
