import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PriceHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Comma-separated asset IDs' })
  @IsOptional()
  @IsString()
  assetIds?: string;

  @ApiPropertyOptional({ description: 'Range key (1M, 3M, 6M, 1Y, YTD, ALL)' })
  @IsOptional()
  @IsString()
  range?: string;
}
