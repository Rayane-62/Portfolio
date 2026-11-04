import { Controller, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { MAX_IMAGE_BYTES, UploadKind, UploadsService } from './uploads.service';

/**
 * POST /api/admin/uploads?kind=photo|project|cv   (multipart, champ « file »)
 * → { url, publicId } à renvoyer ensuite dans les informations ou le projet.
 * Les images sont converties en WebP ; le CV est un PDF gardé tel quel (10 Mo max).
 */
@Controller('admin/uploads')
@UseGuards(AdminAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES } }))
  upload(@UploadedFile() file: Express.Multer.File, @Query('kind') kind?: string) {
    const known: UploadKind = kind === 'photo' || kind === 'cv' ? kind : 'project';
    return this.uploads.save(file, known);
  }
}
