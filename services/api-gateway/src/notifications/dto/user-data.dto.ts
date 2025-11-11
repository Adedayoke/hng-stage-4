import { IsString, IsUrl, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Action link', example: 'https://example.com/verify' })
  @IsUrl()
  link: string;

  @ApiPropertyOptional({ description: 'Additional metadata', example: { order_id: '123' } })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}