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
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionResponseDto, TransactionListResponseDto } from './dto/transaction-response.dto';
import { BatchDeleteTransactionsDto } from './dto/batch-delete-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('transactions')
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transactions',
    type: TransactionListResponseDto,
  })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: TransactionQueryDto,
  ): Promise<TransactionListResponseDto> {
    return this.transactionsService.findAll(req.user.userId, query);
  }

  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch delete transactions (soft delete with reversal)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch delete results',
  })
  async removeMany(
    @Request() req: AuthenticatedRequest,
    @Body() dto: BatchDeleteTransactionsDto,
  ): Promise<{ deletedIds: string[]; failedIds: string[] }> {
    return this.transactionsService.removeMany(req.user.userId, dto.ids);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export transactions as CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv')
  async exportCsv(
    @Request() req: AuthenticatedRequest,
    @Query() query: TransactionQueryDto,
    @Res() res: any,
  ): Promise<void> {
    const csv = await this.transactionsService.exportCsv(req.user.userId, query);
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction details',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
  })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
  })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction (soft delete with reversal)' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Transaction deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
  })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.transactionsService.remove(req.user.userId, id);
  }
}
