import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { InvestmentsService } from './investments.service';
import { MarketPriceService } from './market-price.service';
import {
  CreateInvestmentOperationDto,
  UpdateInvestmentOperationDto,
  InvestmentOperationQueryDto,
  CreateInvestmentOperationBatchDto,
  PriceHistoryQueryDto,
  CreateInvestmentGoalDto,
  UpdateInvestmentGoalDto,
} from './dto';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly marketPriceService: MarketPriceService,
  ) {}

  @Post('operations')
  @ApiOperation({ summary: 'Create a new investment operation' })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInvestmentOperationDto,
  ) {
    return this.investmentsService.create(req.user.userId, dto);
  }

  @Post('operations/batch')
  @ApiOperation({ summary: 'Create multiple investment operations' })
  createBatch(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInvestmentOperationBatchDto,
  ) {
    return this.investmentsService.createBatch(req.user.userId, dto.operations);
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get all investment operations' })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: InvestmentOperationQueryDto,
  ) {
    return this.investmentsService.findAll(req.user.userId, query);
  }

  @Get('operations/:id')
  @ApiOperation({ summary: 'Get operation by ID' })
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.investmentsService.findOne(req.user.userId, id);
  }

  @Put('operations/:id')
  @ApiOperation({ summary: 'Update an operation' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestmentOperationDto,
  ) {
    return this.investmentsService.update(req.user.userId, id, dto);
  }

  @Delete('operations/:id')
  @ApiOperation({ summary: 'Delete an operation' })
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.investmentsService.remove(req.user.userId, id);
  }

  @Get('holdings')
  @ApiOperation({ summary: 'Get current holdings' })
  getHoldings(@Request() req: AuthenticatedRequest) {
    return this.investmentsService.getHoldings(req.user.userId);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get portfolio summary' })
  getPortfolio(@Request() req: AuthenticatedRequest) {
    return this.investmentsService.getPortfolioSummary(req.user.userId);
  }

  @Get('price-history')
  @ApiOperation({ summary: 'Get price history for assets' })
  getPriceHistory(
    @Request() req: AuthenticatedRequest,
    @Query() query: PriceHistoryQueryDto,
  ) {
    const assetIds = query.assetIds
      ? query.assetIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;
    return this.investmentsService.getPriceHistory(req.user.userId, assetIds, query.range);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Get investment goals' })
  getGoals(@Request() req: AuthenticatedRequest) {
    return this.investmentsService.getGoals(req.user.userId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create an investment goal' })
  createGoal(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInvestmentGoalDto,
  ) {
    return this.investmentsService.createGoal(req.user.userId, dto);
  }

  @Put('goals/:id')
  @ApiOperation({ summary: 'Update an investment goal' })
  updateGoal(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestmentGoalDto,
  ) {
    return this.investmentsService.updateGoal(req.user.userId, id, dto);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete an investment goal' })
  removeGoal(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.investmentsService.removeGoal(req.user.userId, id);
  }

  @Post('prices/refresh')
  @ApiOperation({ summary: 'Refresh prices for specified assets' })
  @ApiBody({ schema: { type: 'object', properties: { assetIds: { type: 'array', items: { type: 'string' } } } } })
  refreshPrices(@Body('assetIds') assetIds: string[]) {
    return this.marketPriceService.refreshPrices(assetIds);
  }

  @Post('prices/refresh-all')
  @ApiOperation({ summary: 'Refresh prices for all assets' })
  async refreshAllPrices(@Request() req: AuthenticatedRequest) {
    // Get all user's assets and refresh their prices
    const holdings = await this.investmentsService.getHoldings(req.user.userId);
    const assetIds = holdings.map(h => h.assetId);
    if (assetIds.length === 0) {
      return { message: 'No assets to refresh', results: [] };
    }
    const results = await this.marketPriceService.refreshPrices(assetIds);
    return { message: `Refreshed ${results.length} assets`, results };
  }

  @Get('symbols/search')
  @ApiOperation({ summary: 'Search for asset symbols' })
  searchSymbols(@Query('q') query: string) {
    if (!query || query.length < 1) {
      return [];
    }
    return this.marketPriceService.searchSymbol(query);
  }
}
