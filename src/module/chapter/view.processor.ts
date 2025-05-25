import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ComicService } from 'src/module/comic/comic.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('view')
export class ViewProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comicService: ComicService,
  ) {}

  @Process('record-view')
  async handleRecordView(job: Job<{ chapterId: number; comicId: number }>) {
    await this.prisma.view_history.create({
      data: {
        comicId: job.data.comicId,
        chapterId: job.data.chapterId,
      },
    });
  }

  // @Process('update-views')
  // async handleUpdateComicViews(
  //   job: Job<{ comicId: number; chapterId: number }>,
  // ) {
  //   await this.prisma.chapter.update({
  //     where: { id: job.data.chapterId },
  //     data: {
  //       views: {
  //         increment: 1,
  //       },
  //     },
  //   });
  //   await this.comicService.updateViewByComic(job.data.comicId);
  // }
}
