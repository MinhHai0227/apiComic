import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ViewhistoryService } from 'src/module/viewhistory/viewhistory.service';

@Processor('view')
export class ViewProcessor {
  constructor(private readonly viewhistoryService: ViewhistoryService) {}

  @Process('record-view')
  async handleRecordView(job: Job<{ chapterId: number; comicId: number }>) {
    await this.viewhistoryService.createViewhistory(
      job.data.comicId,
      job.data.chapterId,
    );
  }
}
