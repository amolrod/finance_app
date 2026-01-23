import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto, BudgetStatusDto } from './dto/budget-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('budgets')
@Controller({ path: 'budgets', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BudgetResponseDto })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiQuery({ name: 'periodMonth', required: false, example: '2024-01' })
  @ApiResponse({ status: HttpStatus.OK, type: [BudgetResponseDto] })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('periodMonth') periodMonth?: string,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsService.findAll(req.user.userId, periodMonth);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current month budget status' })
  @ApiResponse({ status: HttpStatus.OK, type: [BudgetStatusDto] })
  async getStatus(@Request() req: AuthenticatedRequest): Promise<BudgetStatusDto[]> {
    return this.budgetsService.getStatus(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: BudgetResponseDto })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: HttpStatus.OK, type: BudgetResponseDto })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete budget' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.budgetsService.remove(req.user.userId, id);
  }
}
