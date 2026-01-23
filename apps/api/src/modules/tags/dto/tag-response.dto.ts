import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ description: 'Tag ID' })
  id: string;

  @ApiProperty({ description: 'Tag name' })
  name: string;

  @ApiPropertyOptional({ description: 'Tag color' })
  color: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
}
