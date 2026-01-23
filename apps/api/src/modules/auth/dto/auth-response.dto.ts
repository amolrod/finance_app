import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstName: string | null;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastName: string | null;
}

export class TokensDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time', example: '15m' })
  expiresIn: string;
}

export class AuthResponseDto extends TokensDto {
  @ApiProperty({ description: 'User information', type: UserDto })
  user: UserDto;
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName: string | null;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName: string | null;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}
