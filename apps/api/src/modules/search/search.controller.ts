import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SearchService, GlobalSearchResponse } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @GetUser('id') userId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<GlobalSearchResponse> {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    return this.searchService.globalSearch(userId, query, parsedLimit);
  }
}
