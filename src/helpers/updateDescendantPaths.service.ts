import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class updateDescendantPathsService {
    constructor(private prisma: PrismaService) { }

    async updateDescendantPaths(oldPathPrefix: string, newPathPrefix: string) {
        // Get all descendant folders
        const descendants = await this.prisma.folder.findMany({
            where: { path: { startsWith: oldPathPrefix + '/' } },
        });

        for (const desc of descendants) {
            await this.prisma.folder.update({
                where: { id: desc.id },
                data: { path: desc.path.replace(oldPathPrefix, newPathPrefix) },
            });
        }
    }



}