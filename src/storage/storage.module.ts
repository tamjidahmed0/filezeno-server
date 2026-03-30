import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  controllers: [],
  exports: [StorageService]
})
export class StorageModule {}
