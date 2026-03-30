import { Module } from '@nestjs/common';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';



@Module({
  imports: [FoldersModule, FilesModule, ConfigModule.forRoot(), AuthModule, StorageModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
