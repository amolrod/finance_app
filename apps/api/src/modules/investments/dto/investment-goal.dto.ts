import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvestmentGoalScope {
  PORTFOLIO = 'PORTFOLIO',
  ASSET = 'ASSET',
}

export class CreateInvestmentGoalDto {
  @ApiProperty({ description: 'Goal name' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: InvestmentGoalScope })
  @IsEnum(InvestmentGoalScope)
  scope: InvestmentGoalScope;

  @ApiPropertyOptional({ description: 'Asset ID for asset-specific goals' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiProperty({ description: 'Target amount' })
  @IsNumber()
  @Type(() => Number)
  targetAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'EUR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Target date' })
  @IsOptional()
  @IsString()
  targetDate?: string;

  @ApiPropertyOptional({ description: 'Alert at 80% progress' })
  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @ApiPropertyOptional({ description: 'Alert at 100% progress' })
  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;
}

export class UpdateInvestmentGoalDto {
  @ApiPropertyOptional({ description: 'Goal name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: InvestmentGoalScope })
  @IsOptional()
  @IsEnum(InvestmentGoalScope)
  scope?: InvestmentGoalScope;

  @ApiPropertyOptional({ description: 'Asset ID for asset-specific goals' })
  @IsOptional()
  @IsUUID()
  assetId?: string | null;

  @ApiPropertyOptional({ description: 'Target amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'EUR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Target date' })
  @IsOptional()
  @IsString()
  targetDate?: string | null;

  @ApiPropertyOptional({ description: 'Alert at 80% progress' })
  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @ApiPropertyOptional({ description: 'Alert at 100% progress' })
  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;
}
