import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OperationType } from '@prisma/client';

export class CreateInvestmentOperationDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  assetId: string;

  @ApiProperty({ enum: OperationType, description: 'Operation type' })
  @IsEnum(OperationType)
  type: OperationType;

  @ApiProperty({ description: 'Quantity of units', example: 10.5 })
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 150.25 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Type(() => Number)
  pricePerUnit: number;

  @ApiPropertyOptional({ description: 'Fees/commissions', example: 5.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fees?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Date of operation' })
  @IsDateString()
  occurredAt: string;

  @ApiPropertyOptional({ description: 'Account ID (broker/investment account)' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Platform/broker (legacy, prefer accountId)', example: 'MyInvestor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvestmentOperationDto {
  @ApiPropertyOptional({ description: 'Asset ID' })
  @IsOptional()
  @IsString()
  assetId?: string;
  @ApiPropertyOptional({ enum: OperationType })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @ApiPropertyOptional({ description: 'Quantity of units' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Price per unit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Type(() => Number)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Fees/commissions' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fees?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Account ID (broker/investment account)' })
  @IsOptional()
  @IsString()
  accountId?: string | null;

  @ApiPropertyOptional({ description: 'Platform/broker (legacy, prefer accountId)', example: 'MyInvestor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform?: string;

  @ApiPropertyOptional({ description: 'Date of operation' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvestmentOperationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsOptional()
  @IsString()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ enum: OperationType })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
