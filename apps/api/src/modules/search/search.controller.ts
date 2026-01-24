import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SearchService, GlobalSearchResponse } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @Request() req: AuthenticatedRequest,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<GlobalSearchResponse> {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    return this.searchService.globalSearch(req.user.userId, query, parsedLimit);
  }
}
