import { Module } from '@nestjs/common';
import { ComicService } from './comic.service';
import { ComicController } from './comic.controller';
import { CategoryModule } from 'src/module/category/category.module';
import { CountryModule } from 'src/module/country/country.module';

@Module({
  controllers: [ComicController],
  providers: [ComicService],
  imports: [CategoryModule, CountryModule],
  exports: [ComicService],
})
export class ComicModule {}
