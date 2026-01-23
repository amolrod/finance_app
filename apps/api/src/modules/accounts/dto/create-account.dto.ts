import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'My Checking Account',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: 'BANK',
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @ApiPropertyOptional({
    description: 'Initial balance (use string for precision)',
    example: '1000.00',
    default: '0',
  })
  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message: 'Initial balance must be a valid decimal with max 2 decimal places',
  })
  initialBalance?: string;

  @ApiPropertyOptional({
    description: 'Account color (hex)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Account icon',
    example: '🏦',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
