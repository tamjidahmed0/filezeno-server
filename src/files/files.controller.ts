import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UploadFileDto } from './dto/files.dto';
import path, { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { StorageService } from 'src/storage/storage.service';
import type { Response } from 'express';

@ApiTags('Files')
@Controller('files')
export class FilesController {

    constructor(
        private filesService: FilesService,
        private storageService: StorageService
    ) { }



    // ─── UPLOAD ───
    @Post('upload')
    @UseGuards(JwtAuthGuard)
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
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
        @Req() req
    ) {
        const userId = req.user.id;
        return this.filesService.uploadFile(userId, file, dto.folderId, dto.description);
    }


    // ─── SERVE FILE ───
    @Get('serve/:filename')
    async serveFile(
        @Param('filename') filename: string,
        @Query('sig') sig: string,
        @Query('exp') exp: string,
        @Res() res: Response,
    ) {
        // Verify signature
        try {
            this.storageService.verifySignedUrl(filename, sig, exp);

        } catch {
            throw new ForbiddenException('Invalid or expired link');
        }

        const filePath = path.join(process.cwd(), 'uploads', filename);

        // console.log(filePath)

        res.sendFile(filePath);
    }




    // ─── DOWNLOAD ───

    @Get(':id/download')
    @UseGuards(JwtAuthGuard)
    async download(
        @Req() req,
        @Param('id') id: string,
    ) {
        const user = req.user;
        const file = await this.filesService.getFileForDownload(user.id, id);


        const { url, expiresAt } = this.storageService.generateSignedUrl(file.storagePath);

        return {
            url: `${process.env.APP_URL || 'http://localhost:4000'}${url}`,
            expiresAt
        };
    }












}
