import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ 
    status: 201, 
    description: 'Notification queued successfully',
    type: NotificationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createNotification(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    try {
      const result = await this.notificationsService.createNotification(createNotificationDto);

      return {
        success: true,
        data: result,
        message: 'Notification queued successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to queue notification',
      };
    }
  }
}