import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface UserData {
  user_id: string;
  push_token: string;
}

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('services.userService') || 'http://localhost:3001';
  }

  async getUserById(userId: string): Promise<UserData> {
    try {
      this.logger.log(`Fetching user data for user_id: ${userId}`);
      
      const response = await axios.get(`${this.baseUrl}/api/v1/users/${userId}`);
      
      if (!response.data.success) {
        throw new Error('User service returned unsuccessful response');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}`, error.message);
      throw new Error(`User service error: ${error.message}`);
    }
  }
}
