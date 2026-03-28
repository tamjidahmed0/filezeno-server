import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UploadFileDto } from './dto/files.dto';
import { extname } from 'path';

@ApiTags('Files')
@Controller('files')
export class FilesController {

    constructor(private filesService: FilesService) { }



    // ─── UPLOAD ───
    @Post('upload')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const unique = uuidv4();
                    const ext = extname(file.originalname);
                    cb(null, `${unique}${ext}`);
                },
            }),
            limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        }),
    )
    upload(
        userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
    ) {
        return this.filesService.uploadFile(userId = '1', file, dto.folderId, dto.description);
    }
}
