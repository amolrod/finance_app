import { PartialType, OmitType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['type'] as const),
) {
  @ApiPropertyOptional({
    description: 'Sort order for display',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
