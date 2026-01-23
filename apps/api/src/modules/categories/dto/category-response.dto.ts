import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class CategoryChildDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category type', enum: CategoryType })
  type: CategoryType;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId: string | null;

  @ApiPropertyOptional({ description: 'Category color' })
  color: string | null;

  @ApiPropertyOptional({ description: 'Category icon' })
  icon: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Is system category' })
  isSystem: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Food & Dining' })
  name: string;

  @ApiProperty({ description: 'Category type', enum: CategoryType })
  type: CategoryType;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId: string | null;

  @ApiPropertyOptional({ description: 'Category color', example: '#EF4444' })
  color: string | null;

  @ApiPropertyOptional({ description: 'Category icon', example: '🍔' })
  icon: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Is system category' })
  isSystem: boolean;

  @ApiPropertyOptional({ type: [CategoryChildDto], description: 'Subcategories' })
  children?: CategoryChildDto[];

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
}
