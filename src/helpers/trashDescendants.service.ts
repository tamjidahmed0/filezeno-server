import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";


@Injectable()
export class TrashDescendantsService {
    constructor(private prisma: PrismaService) { }

    async trashDescendants(folderId: string) {
        const children = await this.prisma.folder.findMany({
            where: { parentId: folderId },
        });
        for (const child of children) {
            await this.trashDescendants(child.id);
            await this.prisma.folder.update({
                where: { id: child.id },
                data: { isTrashed: true, trashedAt: new Date() },
            });
        }
        // Trash files inside this folder
        await this.prisma.file.updateMany({
            where: { folderId },
            data: { isTrashed: true, trashedAt: new Date() },
        });
    }

}