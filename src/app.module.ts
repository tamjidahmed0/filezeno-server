import { Module } from '@nestjs/common';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';



@Module({
  imports: [FoldersModule, FilesModule, ConfigModule.forRoot(), AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
