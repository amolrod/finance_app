import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { ConfirmImportDto, ImportPreviewResponse, ImportResultDto } from './dto/import.dto';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  private readonly logger = new Logger(ImportController.name);
  
  constructor(private readonly importService: ImportService) {}

  @Get('formats')
  @ApiOperation({ summary: 'Get supported bank formats' })
  getSupportedFormats() {
    return this.importService.getSupportedFormats();
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview a bank statement import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        accountId: {
          type: 'string',
        },
        format: {
          type: 'string',
          description: 'Optional format hint (e.g., santander_es, bbva_es)',
        },
      },
      required: ['file', 'accountId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max (PDFs can be larger)
      },
      fileFilter: (req, file, callback) => {
        // Accept CSV, Excel, and PDF files
        const allowedMimes = [
          'text/csv',
          'text/plain',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf',
          'application/octet-stream',
        ];
        const allowedExts = ['.csv', '.txt', '.xlsx', '.xls', '.xlsm', '.pdf'];
        
        const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Solo se permiten archivos CSV, Excel (.xlsx, .xls) o PDF'),
            false,
          );
        }
      },
    }),
  )
  async previewImport(
    @Req() req: { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body('accountId') accountId: string,
    @Body('format') formatHint?: string,
  ): Promise<ImportPreviewResponse> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!accountId) {
      throw new BadRequestException('Se requiere el ID de la cuenta');
    }

    return this.importService.previewImport(
      req.user.userId,
      accountId,
      file.buffer,
      file.originalname,
      formatHint,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm and import transactions' })
  async confirmImport(
    @Req() req: { user: { userId: string } },
    @Body() dto: ConfirmImportDto,
  ): Promise<ImportResultDto> {
    this.logger.debug(`Confirm import received: accountId=${dto.accountId}, transactions=${dto.transactions?.length}, hasPreview=${!!dto.preview}`);
    try {
      return await this.importService.confirmImport(req.user.userId, dto);
    } catch (error) {
      this.logger.error('Confirm import error:', error);
      throw error;
    }
  }
}
