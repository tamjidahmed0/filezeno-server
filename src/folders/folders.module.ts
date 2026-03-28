import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [FoldersService, PrismaModule],
  controllers: [FoldersController]
})
export class FoldersModule {}
