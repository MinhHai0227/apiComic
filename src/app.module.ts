import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './module/user/user.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CoinModule } from './module/coin/coin.module';
import { CountryModule } from './module/country/country.module';
import { CategoryModule } from './module/category/category.module';
import { ComicModule } from './module/comic/comic.module';
import { ChapterModule } from './module/chapter/chapter.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChapterimageModule } from './module/chapterimage/chapterimage.module';
import { ChapterunlockModule } from './module/chapterunlock/chapterunlock.module';
import { NotificationModule } from './module/notification/notification.module';
import { ComicfollowerModule } from './module/comicfollower/comicfollower.module';
import { ComichistoryModule } from './module/comichistory/comichistory.module';
import { CommentModule } from './module/comment/comment.module';
import { MomoModule } from './momo/momo.module';
import { TransactionModule } from './module/transaction/transaction.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploadfile'),
      serveRoot: '/api/v1/uploadfile',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    AuthModule,
    CoinModule,
    CountryModule,
    CategoryModule,
    ComicModule,
    ChapterModule,
    ChapterimageModule,
    ChapterunlockModule,
    NotificationModule,
    ComicfollowerModule,
    ComichistoryModule,
    CommentModule,
    MomoModule,
    TransactionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
