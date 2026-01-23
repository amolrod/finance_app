import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Category, CategoryType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new category
   */
  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check for duplicate name within same parent
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
        parentId: dto.parentId || null,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    // Verify parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, userId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    // Get max sort order
    const maxOrder = await this.prisma.category.aggregate({
      where: { userId, parentId: dto.parentId || null },
      _max: { sortOrder: true },
    });

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId,
        color: dto.color,
        icon: dto.icon,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
      include: { children: true },
    });

    this.logger.log(`Category created: ${category.id} for user ${userId}`);
    return this.mapToResponse(category);
  }

  /**
   * Find all categories for a user
   */
  async findAll(
    userId: string,
    type?: CategoryType,
  ): Promise<CategoryResponseDto[]> {
    const where: Prisma.CategoryWhereInput = {
      userId,
      deletedAt: null,
      parentId: null, // Get root categories only
      ...(type && { type }),
    };

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((cat) => this.mapToResponse(cat));
  }

  /**
   * Find one category by ID
   */
  async findOne(userId: string, categoryId: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponse(category);
  }

  /**
   * Update a category
   */
  async update(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Check for system category
    if (existing.isSystem && dto.name) {
      throw new ConflictException('Cannot modify system category name');
    }

    // Check for duplicate name if changing name
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          userId,
          name: dto.name,
          parentId: dto.parentId ?? existing.parentId,
          deletedAt: null,
          id: { not: categoryId },
        },
      });

      if (duplicate) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
      },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Category updated: ${categoryId}`);
    return this.mapToResponse(category);
  }

  /**
   * Soft delete a category
   */
  async remove(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.isSystem) {
      throw new ConflictException('Cannot delete system category');
    }

    // Check for transactions using this category
    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId, deletedAt: null },
    });

    if (transactionCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing transactions. Remove transactions first or reassign them.',
      );
    }

    // Soft delete category and its children
    await this.prisma.category.updateMany({
      where: {
        OR: [{ id: categoryId }, { parentId: categoryId }],
        userId,
      },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category soft-deleted: ${categoryId}`);
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(
    category: Category & { children?: Category[] },
  ): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      parentId: category.parentId,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isSystem: category.isSystem,
      children: category.children?.map((child) => ({
        id: child.id,
        name: child.name,
        type: child.type,
        parentId: child.parentId,
        color: child.color,
        icon: child.icon,
        sortOrder: child.sortOrder,
        isSystem: child.isSystem,
        createdAt: child.createdAt,
      })),
      createdAt: category.createdAt,
    };
  }
}
