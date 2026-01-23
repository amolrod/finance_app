import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Tag } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTagDto): Promise<TagResponseDto> {
    const existing = await this.prisma.tag.findFirst({
      where: { userId, name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    const tag = await this.prisma.tag.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color,
      },
    });

    this.logger.log(`Tag created: ${tag.id}`);
    return this.mapToResponse(tag);
  }

  async findAll(userId: string): Promise<TagResponseDto[]> {
    const tags = await this.prisma.tag.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => this.mapToResponse(tag));
  }

  async findOne(userId: string, tagId: string): Promise<TagResponseDto> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return this.mapToResponse(tag);
  }

  async update(userId: string, tagId: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    const existing = await this.prisma.tag.findFirst({
      where: { id: tagId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.tag.findFirst({
        where: { userId, name: dto.name, deletedAt: null, id: { not: tagId } },
      });

      if (duplicate) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    const tag = await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        name: dto.name,
        color: dto.color,
      },
    });

    return this.mapToResponse(tag);
  }

  async remove(userId: string, tagId: string): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.update({
      where: { id: tagId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Tag soft-deleted: ${tagId}`);
  }

  private mapToResponse(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    };
  }
}
