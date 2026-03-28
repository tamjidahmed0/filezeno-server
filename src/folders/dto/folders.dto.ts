import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ example: 'My Documents' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false, description: 'Parent folder ID (null = root)' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ required: false, example: '#4285F4' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class RenameFolderDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}

export class MoveFolderDto {
  @ApiProperty({ required: false, description: 'Target parent folder ID (null = root)' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}