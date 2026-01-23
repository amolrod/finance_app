import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { CsvParserService } from './parsers/csv-parser.service';
import { ExcelParserService } from './parsers/excel-parser.service';
import { PdfParserService } from './parsers/pdf-parser.service';
import { CategoryMatcherService } from './category-matcher.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TransactionsModule, AccountsModule, CategoriesModule],
  controllers: [ImportController],
  providers: [
    ImportService,
    CsvParserService,
    ExcelParserService,
    PdfParserService,
    CategoryMatcherService,
  ],
  exports: [ImportService],
})
export class ImportModule {}
