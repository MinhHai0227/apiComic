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
import { ComichistoryService } from './comichistory.service';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateHistoryDto } from 'src/module/comichistory/dto/create-history.dto';
import { PanigationComichistoryDto } from 'src/module/comichistory/dto/panigation-comichistory.dto';

@Controller('comichistory')
export class ComichistoryController {
  constructor(private readonly comichistoryService: ComichistoryService) {}

  @Post(':comic_id/:chapter_id')
  createAndUpdateComicHistory(@Request() req, @Param() dto: CreateHistoryDto) {
    return this.comichistoryService.createAndUpdateComicHistory(
      req.user.id,
      dto,
    );
  }

  @Get()
  getAllHistoryComicByUser(
    @Request() req,
    @Query() query: PanigationComichistoryDto,
  ) {
    return this.comichistoryService.getAllHistoryComicByUser(
      req.user.id,
      query,
    );
  }

  @Get(':comic_id')
  getChapterlast(
    @Request() req,
    @Param('comic_id', ParseIntPipe) comic_id: number,
  ) {
    return this.comichistoryService.getChapterlast(req.user.id, comic_id);
  }

  @Delete(':comic_id')
  deleteHistoryComic(
    @Request() req,
    @Param('comic_id', ParseIntPipe) comic_id: number,
  ) {
    return this.comichistoryService.deleteHistoryComic(req.user.id, comic_id);
  }
}
