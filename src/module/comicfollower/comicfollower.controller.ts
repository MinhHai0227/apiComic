import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ComicfollowerService } from './comicfollower.service';
import { PanigationComicfollowerDto } from 'src/module/comicfollower/dto/panigation-comicfollower.dto';

@Controller('comicfollower')
export class ComicfollowerController {
  constructor(private readonly comicfollowerService: ComicfollowerService) {}

  @Post(':comic_id')
  folowwerComic(
    @Request() req,
    @Param('comic_id', ParseIntPipe) comic_id: number,
  ) {
    return this.comicfollowerService.folowwerComic(req.user.id, comic_id);
  }

  @Get(':comic_id')
  checkComicFollowerExits(
    @Request() req,
    @Param('comic_id', ParseIntPipe) comic_id: number,
  ) {
    return this.comicfollowerService.checkComicFollowerExits(
      req.user.id,
      comic_id,
    );
  }

  @Delete(':comic_id')
  unFollowerComic(
    @Request() req,
    @Param('comic_id', ParseIntPipe) comic_id: number,
  ) {
    return this.comicfollowerService.unFollowerComic(req.user.id, comic_id);
  }

  @Get()
  getAllFollowerComic(
    @Request() req,
    @Query() query: PanigationComicfollowerDto,
  ) {
    return this.comicfollowerService.getAllFollowerComic(req.user.id, query);
  }
}
