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

import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountResponseDto, AccountListResponseDto, AccountSummaryDto } from './dto/account-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('accounts')
@Controller({ path: 'accounts', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of accounts',
    type: AccountListResponseDto,
  })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ): Promise<AccountListResponseDto> {
    const result = await this.accountsService.findAll(req.user.userId, pagination);
    return {
      data: result.data,
      total: result.total,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get accounts summary' })
  @ApiQuery({ name: 'currency', required: false, description: 'Target currency for conversion' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accounts summary',
    type: AccountSummaryDto,
  })
  async getSummary(
    @Request() req: AuthenticatedRequest,
    @Query('currency') targetCurrency?: string,
  ): Promise<AccountSummaryDto> {
    return this.accountsService.getSummary(req.user.userId, targetCurrency);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account details',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account updated',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Account deleted or archived',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.accountsService.remove(req.user.userId, id);
  }
}
