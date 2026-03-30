import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFolderDto } from './dto/folders.dto';




@Injectable()
export class FoldersService {

    constructor(private prisma: PrismaService) { }



    // ───────────────── CREATE ─────────────────
    async createFolder(userId: string, dto: CreateFolderDto) {
        // Validate parent if given
        let parentPath = '';
        if (dto.parentId) {
            const parent = await this.prisma.folder.findFirst({
                where: { id: dto.parentId, ownerId: userId, isTrashed: false },
            });
            if (!parent) throw new NotFoundException('Parent folder not found');
            parentPath = parent.path;
        }

        // Check duplicate name in same location
        const duplicate = await this.prisma.folder.findFirst({
            where: {
                ownerId: userId,
                parentId: dto.parentId || null,
                name: dto.name,
                isTrashed: false,
            },
        });
        if (duplicate) throw new ConflictException('A folder with this name already exists here');

        const path = `${parentPath}/${dto.name}`;

        const folder = await this.prisma.folder.create({
            data: {
                name: dto.name,
                ownerId: userId,
                parentId: dto.parentId || null,
                path,
                color: dto.color,
            },
            include: { children: true, _count: { select: { files: true, children: true } } },
        });

        await this.logActivity(userId, 'CREATE_FOLDER', folder.id);
        return folder;
    }


    // ───────────────── LIST ─────────────────
    async getFolders(userId: string, parentId?: string) {
        return this.prisma.folder.findMany({
            where: {
                ownerId: userId,
                parentId: parentId || null,
                isTrashed: false,
            },
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { files: true, children: true } },
            },
        });
    }


    // ───────────────── GET ONE ─────────────────
    async getFolderById(userId: string, folderId: string) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, isTrashed: false },
            include: {
                children: {
                    where: { isTrashed: false },
                    include: { _count: { select: { files: true, children: true } } },
                },
                _count: { select: { files: true, children: true } },
            },
        });

        if (!folder) throw new NotFoundException('Folder not found');

        // Must own or have share access
        if (folder.ownerId !== userId) {
            const share = await this.prisma.share.findFirst({
                where: { folderId, sharedWithId: userId, isActive: true },
            });
            if (!share) throw new ForbiddenException('Access denied');
        }

        return folder;
    }



    // ───────────────── BREADCRUMB ─────────────────
    async getBreadcrumb(userId: string, folderId: string) {
        const breadcrumb: any[] = [];
        let currentId: string | null = folderId;

        while (currentId) {
            const folder = await this.prisma.folder.findFirst({
                where: { id: currentId, ownerId: userId },
                select: { id: true, name: true, parentId: true },
            });
            if (!folder) break;
            breadcrumb.unshift(folder);
            currentId = folder.parentId;
        }

        return breadcrumb;
    }






    private async logActivity(userId: string, type: any, folderId?: string, metadata?: any) {
        await this.prisma.activity.create({
            data: { userId, type, folderId, metadata },
        });
    }


}
