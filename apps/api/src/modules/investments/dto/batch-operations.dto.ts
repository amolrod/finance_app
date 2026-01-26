import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvestmentOperationDto } from './investment-operation.dto';

export class CreateInvestmentOperationBatchDto {
  @ApiProperty({ type: [CreateInvestmentOperationDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateInvestmentOperationDto)
  operations: CreateInvestmentOperationDto[];
}
