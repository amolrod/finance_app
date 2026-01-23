import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { RecurringTransactionsService } from './recurring-transactions.service';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionQueryDto,
} from './dto';

@ApiTags('Recurring Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'recurring-transactions', version: '1' })
export class RecurringTransactionsController {
  constructor(private readonly recurringService: RecurringTransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring transaction' })
  @ApiResponse({ status: 201, description: 'Recurring transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Account or category not found' })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.recurringService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recurring transactions' })
  @ApiResponse({ status: 200, description: 'List of recurring transactions' })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: RecurringTransactionQueryDto,
  ) {
    return this.recurringService.findAll(req.user.userId, query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Preview upcoming transactions in the next N days' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days to look ahead (default: 30)' })
  @ApiResponse({ status: 200, description: 'List of upcoming transactions' })
  getUpcoming(
    @Request() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.recurringService.getUpcoming(req.user.userId, daysNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring transaction by ID' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction details' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a recurring transaction' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction updated' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.recurringService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring transaction' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction deleted' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.remove(req.user.userId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a recurring transaction' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction paused' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  pause(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.pause(req.user.userId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused recurring transaction' })
  @ApiParam({ name: 'id', description: 'Recurring transaction ID' })
  @ApiResponse({ status: 200, description: 'Recurring transaction resumed' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  resume(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringService.resume(req.user.userId, id);
  }
}
