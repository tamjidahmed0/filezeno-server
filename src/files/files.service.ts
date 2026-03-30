import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import computeChecksum from 'src/helpers/computeChecksum';
import serializeFile from 'src/helpers/serializeFile';



@Injectable()
export class FilesService {


    constructor(private prisma: PrismaService) { }


    // ───────────────── UPLOAD ─────────────────
    async uploadFile(
        userId: string,
        file: Express.Multer.File,
        folderId?: string,
        description?: string,
    ) {
        // Validate folder belongs to user
        if (folderId) {
            const folder = await this.prisma.folder.findFirst({
                where: { id: folderId, ownerId: userId, isTrashed: false },
            });
            if (!folder) throw new NotFoundException('Folder not found');
        }

        // Check storage quota
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (BigInt(user.storageUsed) + BigInt(file.size) > BigInt(user.storageLimit)) {
            // Delete uploaded file
            fs.unlinkSync(file.path);
            throw new BadRequestException('Storage quota exceeded');
        }

        // Compute checksum
        const checksum = computeChecksum(file.path);
        const ext = path.extname(file.originalname).toLowerCase();

        // Save to DB
        const newFile = await this.prisma.file.create({
            data: {
                name: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: BigInt(file.size),
                extension: ext,
                storagePath: file.path,
                ownerId: userId,
                folderId: folderId || null,
                description,
                checksum,
            },
        });

        // Update storage usage
        await this.prisma.user.update({
            where: { id: userId },
            data: { storageUsed: { increment: BigInt(file.size) } },
        });

        // Log activity
        await this.logActivity(userId, 'UPLOAD', newFile.id);

        return serializeFile(newFile);
    }




    async getFileById(userId: string, fileId: string) {
        const file = await this.prisma.file.findFirst({
            where: { id: fileId, isTrashed: false },
            include: { tags: true, versions: true },
        });
        if (!file) throw new NotFoundException('File not found');

        // Check access: owner or has share
        if (file.ownerId !== userId) {
            const share = await this.prisma.share.findFirst({
                where: {
                    fileId,
                    sharedWithId: userId,
                    isActive: true,
                },
            });
            if (!share) throw new ForbiddenException('Access denied');
        }

        return serializeFile(file);
    }



    // ───────────────── DOWNLOAD ─────────────────
    async getFileForDownload(userId: string, fileId: string) {
        const file = await this.getFileById(userId, fileId);

        // Increment download count
        await this.prisma.file.update({
            where: { id: fileId },
            data: { downloadCount: { increment: 1 } },
        });

        await this.logActivity(userId, 'DOWNLOAD', fileId);

        return file;
    }



    // ───────────────── HELPERS ─────────────────

    private async logActivity(
        userId: string,
        type: any,
        fileId?: string,
        metadata?: any,
    ) {
        await this.prisma.activity.create({
            data: { userId, type, fileId, metadata },
        });
    }


}
