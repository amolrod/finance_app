import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { MarketPriceService } from './market-price.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestmentsController, AssetsController],
  providers: [InvestmentsService, AssetsService, MarketPriceService],
  exports: [InvestmentsService, AssetsService, MarketPriceService],
})
export class InvestmentsModule {}
