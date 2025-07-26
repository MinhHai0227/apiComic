import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private redis: Redis) {}

  async clearCacheByPattern(pattern: string, batchSize = 100): Promise<void> {
    let cursor = 0;
    let pipeline = this.redis.pipeline();
    let totalKeysDeleted = 0;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        batchSize,
      );
      cursor = parseInt(newCursor, 10);
      if (keys.length > 0) {
        pipeline.del(keys);
        totalKeysDeleted += keys.length;
      }
      if (totalKeysDeleted >= 500) {
        await pipeline.exec();
        pipeline = this.redis.pipeline();
        totalKeysDeleted = 0;
      }
    } while (cursor !== 0);

    if (pipeline.length > 0) {
      await pipeline.exec();
    }
  }

  async setCache(key: string, value: any, tll: number) {
    return await this.redis.set(key, value, 'EX', tll);
  }

  async getcache(key: string) {
    const result = await this.redis.get(key);
    return result ? result : null;
  }

  async delCache(key: string) {
    await this.redis.del(key);
  }
}
