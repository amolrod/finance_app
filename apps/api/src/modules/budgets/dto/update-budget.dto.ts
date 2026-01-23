import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'Budget limit amount', example: '500.00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with max 2 decimal places',
  })
  limitAmount?: string;

  @ApiPropertyOptional({ description: 'Alert at 80% threshold' })
  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @ApiPropertyOptional({ description: 'Alert at 100% threshold' })
  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;
}
