import { Controller, Get, Query } from '@nestjs/common';
import { ViewhistoryService } from './viewhistory.service';
import { Public } from 'src/decorator/public.decorator';
import { PanigationViewhistoryDto } from 'src/module/viewhistory/dto/panigation-viewhistory.dto';

@Controller('viewhistory')
export class ViewhistoryController {
  constructor(private readonly viewhistoryService: ViewhistoryService) {}
  @Public()
  @Get()
  getPaginatedTopViews(@Query() query: PanigationViewhistoryDto) {
    return this.viewhistoryService.getPaginatedTopViews(query);
  }
}
