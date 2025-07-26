import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PanigationNotificationDto } from 'src/module/notification/dto/panigation-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getAllNotificationByUser(
    @Request() req,
    @Query() query: PanigationNotificationDto,
  ) {
    return this.notificationService.getAllNotificationByUser(
      req.user.id,
      query,
    );
  }

  @Delete(':id')
  deleteNotidication(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.deleteNotidication(id);
  }
}
