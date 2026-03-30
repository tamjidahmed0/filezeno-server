import { Body, Controller, Post, Req, Get, UseGuards, Query, Param, Patch, Delete } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateFolderDto, MoveFolderDto, RenameFolderDto } from './dto/folders.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';


@Controller('folders')
export class FoldersController {
    constructor(private foldersService: FoldersService) { }

    // ───────────────── CREATE ─────────────────
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new folder' })
    create(@Req() req, @Body() dto: CreateFolderDto) {
        const userId = req.user.id
        return this.foldersService.createFolder(userId, dto);
    }



    // ───────────────── LIST ─────────────────
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List folders (optionally by parent)' })
    list(@Req() req, @Query('parentId') parentId?: string) {
        const userId = req.user.id
        return this.foldersService.getFolders(userId, parentId);
    }



    // ───────────────── GET ONE ─────────────────
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get folder by ID with children' })
    getOne(@Req() req, @Param('id') id: string) {
        const userId = req.user.id
        return this.foldersService.getFolderById(userId, id);
    }



    // ───────────────── BREADCRUMB ─────────────────
    @Get(':id/breadcrumb')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get breadcrumb path for a folder' })
    breadcrumb(@Req() req, @Param('id') id: string) {
        const userId = req.user.id
        return this.foldersService.getBreadcrumb(userId, id);
    }


    // ───────────────── RENAME ─────────────────
    @Patch(':id/rename')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Rename a folder' })
    rename(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: RenameFolderDto,
    ) {
        const userId = req.user.id
        return this.foldersService.renameFolder(userId, id, dto);
    }


    // ───────────────── MOVE ─────────────────
    @Patch(':id/move')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Move folder to another parent' })
    move(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: MoveFolderDto,
    ) {
        const userId = req.user.id
        return this.foldersService.moveFolder(userId, id, dto);
    }



    // ───────────────── TRASH ─────────────────
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Move folder to trash' })
    moveToTrash(@Req() req, @Param('id') id: string) {
        const userId = req.user.id
        return this.foldersService.moveToTrash(userId, id);
    }


}
