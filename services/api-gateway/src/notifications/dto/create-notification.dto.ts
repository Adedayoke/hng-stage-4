import { IsEnum, IsUUID, IsString, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { UserDataDto } from './user-data.dto';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Type of notification', example: NotificationType.EMAIL })
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @ApiProperty({ description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Template code or path', example: 'welcome_email' })
  @IsString()
  template_code: string;

  @ApiProperty({ description: 'Template variables', type: UserDataDto })
  @ValidateNested()
  @Type(() => UserDataDto)
  variables: UserDataDto;

  @ApiProperty({ description: 'Unique request ID for idempotency', example: 'req_abc123xyz' })
  @IsString()
  request_id: string;

  @ApiProperty({ description: 'Priority level (higher = more urgent)', example: 1 })
  @IsInt()
  priority: number;

  @ApiPropertyOptional({ description: 'Additional metadata', example: {} })
  @IsOptional()
  metadata?: Record<string, any>;
}