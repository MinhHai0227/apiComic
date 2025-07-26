import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Min } from 'class-validator';
import { notifiType } from 'generated/prisma';

export class PanigationNotificationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit: number = 10;

  @IsOptional()
  type: notifiType;
}
