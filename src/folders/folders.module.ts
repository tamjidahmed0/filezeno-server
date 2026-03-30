import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { updateDescendantPathsService } from 'src/helpers/updateDescendantPaths.service';


@Module({
  imports : [PrismaModule],
  providers: [FoldersService, updateDescendantPathsService],
  controllers: [FoldersController]
})
export class FoldersModule {}
