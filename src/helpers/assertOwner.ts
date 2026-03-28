import { ForbiddenException, NotFoundException } from "@nestjs/common";

async function assertOwner(userId: string, fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (file.ownerId !== userId) throw new ForbiddenException('Access denied');
    return file;
}

export default assertOwner