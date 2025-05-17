import { Module } from '@nestjs/common';
import { ComicfollowerService } from './comicfollower.service';
import { ComicfollowerController } from './comicfollower.controller';
import { UserModule } from 'src/module/user/user.module';
import { ComicModule } from 'src/module/comic/comic.module';

@Module({
  controllers: [ComicfollowerController],
  providers: [ComicfollowerService],
  imports:[UserModule, ComicModule]
})
export class ComicfollowerModule {}
