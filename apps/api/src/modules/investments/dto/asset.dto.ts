import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({ description: 'Symbol/ticker', example: 'AAPL' })
  @IsString()
  @MaxLength(20)
  symbol: string;

  @ApiProperty({ description: 'Full name', example: 'Apple Inc.' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: AssetType, description: 'Asset type' })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange', example: 'NASDAQ' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  exchange?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  exchange?: string;
}

export class AssetQueryDto {
  @ApiPropertyOptional({ description: 'Search by symbol or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;
}
