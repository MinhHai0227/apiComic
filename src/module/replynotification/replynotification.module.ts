import { Module } from '@nestjs/common';
import { ReplynotificationService } from './replynotification.service';
import { ReplynotificationGateway } from './replynotification.gateway';
import { UserModule } from 'src/module/user/user.module';

@Module({
  imports: [UserModule],
  providers: [ReplynotificationGateway, ReplynotificationService],
  exports: [ReplynotificationService],
})
export class ReplynotificationModule {}
