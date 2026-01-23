import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Category ID (must be expense category)' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Period month (YYYY-MM)', example: '2024-01' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  periodMonth: string;

  @ApiProperty({ description: 'Budget limit amount', example: '500.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with max 2 decimal places',
  })
  limitAmount: string;

  @ApiPropertyOptional({ description: 'Alert at 80% threshold', default: true })
  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @ApiPropertyOptional({ description: 'Alert at 100% threshold', default: true })
  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;
}
