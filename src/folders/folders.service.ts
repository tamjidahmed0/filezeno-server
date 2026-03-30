import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFolderDto, MoveFolderDto, RenameFolderDto } from './dto/folders.dto';
import { updateDescendantPathsService } from 'src/helpers/updateDescendantPaths.service';
import { TrashDescendantsService } from 'src/helpers/trashDescendants.service';





@Injectable()
export class FoldersService {

    constructor(
        private prisma: PrismaService,
        private updateDescendantPaths: updateDescendantPathsService,
        private trashDescendants: TrashDescendantsService,

    ) { }



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


    // ───────────────── RENAME ─────────────────
    async renameFolder(userId: string, folderId: string, dto: RenameFolderDto) {

        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, ownerId: userId },
            select: { id: true, name: true, path: true },
        });
        if (!folder) throw new NotFoundException('Folder not found');

        // Update path for this folder and all descendants
        const newPath = folder.path.replace(/\/[^/]+$/, `/${dto.name}`);
        await this.updateDescendantPaths.updateDescendantPaths(folder.path, newPath);

        const updated = await this.prisma.folder.update({
            where: { id: folderId },
            data: { name: dto.name, path: newPath },
        });

        await this.logActivity(userId, 'RENAME', folderId, {
            oldName: folder.name,
            newName: dto.name,
        });

        return updated;
    }



    // ───────────────── MOVE ─────────────────
    async moveFolder(userId: string, folderId: string, dto: MoveFolderDto) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, ownerId: userId },
            select: { id: true, name: true, path: true },
        });
        if (!folder) throw new NotFoundException('Folder not found');

        // Prevent moving folder into itself or its descendants
        if (dto.parentId) {
            if (dto.parentId === folderId) {
                throw new BadRequestException('Cannot move folder into itself');
            }

            // isDescendant logic
            let currentId: string | null = dto.parentId;
            while (currentId) {
                if (currentId === folderId) {
                    throw new BadRequestException('Cannot move folder into its own descendant');
                }
                const f = await this.prisma.folder.findUnique({
                    where: { id: currentId },
                    select: { parentId: true },
                });
                currentId = f?.parentId || null;
            }

            const targetParent = await this.prisma.folder.findFirst({
                where: { id: dto.parentId, ownerId: userId, isTrashed: false },
            });
            if (!targetParent) throw new NotFoundException('Target folder not found');
        }

        const newParentPath = dto.parentId
            ? (await this.prisma.folder.findUnique({ where: { id: dto.parentId } }))!.path
            : '';
        const newPath = `${newParentPath}/${folder.name}`;

        await this.updateDescendantPaths.updateDescendantPaths(folder.path, newPath);

        const updated = await this.prisma.folder.update({
            where: { id: folderId },
            data: { parentId: dto.parentId || null, path: newPath },
        });

        await this.logActivity(userId, 'MOVE', folderId);
        return updated;
    }



    // ───────────────── TRASH ─────────────────
    async moveToTrash(userId: string, folderId: string) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, ownerId: userId },
            select: { id: true, name: true, path: true },
        });
        if (!folder) throw new NotFoundException('Folder not found');

        // Trash folder and all descendants recursively
        await this.trashDescendants.trashDescendants(folderId);

        const updated = await this.prisma.folder.update({
            where: { id: folderId },
            data: { isTrashed: true, trashedAt: new Date() },
        });

        await this.logActivity(userId, 'MOVE_TO_TRASH', folderId);
        return updated;
    }



    // ───────────────── RESTORE FROM TRASH ─────────────────
    async restoreFromTrash(userId: string, folderId: string) {
        const folder = await this.prisma.folder.findFirst({
            where: { id: folderId, ownerId: userId },
            select: { id: true, name: true, path: true },
        });
        if (!folder) throw new NotFoundException('Folder not found');

        await this.prisma.folder.updateMany({
            where: { id: folderId },
            data: { isTrashed: false, trashedAt: null },
        });

        return { message: 'Folder restored' };
    }




    private async logActivity(userId: string, type: any, folderId?: string, metadata?: any) {
        await this.prisma.activity.create({
            data: { userId, type, folderId, metadata },
        });
    }


}
