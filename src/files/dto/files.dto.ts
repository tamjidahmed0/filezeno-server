import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    folderId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class MoveFileDto {
    @ApiProperty({ description: 'Target folder ID (null = root)', required: false })
    @IsOptional()
    @IsString()
    folderId?: string;
}

export class RenameFileDto {
    @ApiProperty()
    @IsString()
    name: string;
}

export class UpdateFileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}