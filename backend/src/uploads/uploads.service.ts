import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp, { type OutputInfo } from 'sharp';
import { cloudinaryDestroy, cloudinaryImage, cloudinaryUpload, type CloudinaryConfig, parseCloudinaryUrl } from './cloudinary';

/**
 * Deux stockages possibles :
 *  - par défaut, le disque du serveur (VPS), dans backend/uploads : pense à le sauvegarder ;
 *  - Cloudinary dès que CLOUDINARY_URL est défini (hébergeurs sans disque permanent, comme Render).
 */
export const UPLOADS_DIR = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** Les trois sortes de fichiers de l'admin : la photo de profil, l'image d'un projet, le CV. */
export type UploadKind = 'photo' | 'project' | 'cv';

/**
 * Les images sont redimensionnées et converties en WebP à l'envoi :
 * une photo de téléphone de 5 Mo devient ~150-300 Ko, le site reste rapide en 4G.
 * Le CV, lui, est un PDF : il est gardé tel quel.
 */
const RESIZE: Record<'photo' | 'project', { max: number; quality: number }> = {
  photo: { max: 1200, quality: 85 },
  project: { max: 1600, quality: 80 },
};

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
export const ALLOWED_IMAGE_TYPES = Object.keys(EXT);

/** Vérifie la « signature » des premiers octets du fichier. */
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (!buf || buf.length < 12) return false;
  switch (mime) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
    case 'image/avif':
      return buf.toString('ascii', 4, 8) === 'ftyp' && /avi[fs]/.test(buf.toString('ascii', 8, 12));
    default:
      return false;
  }
}

/** Un PDF commence toujours par « %PDF- ». */
function looksLikePdf(buf: Buffer): boolean {
  return !!buf && buf.length > 8 && buf.toString('ascii', 0, 5) === '%PDF-';
}

export interface StoredFile {
  url: string;
  publicId: string;
  /** Images seulement : dimensions après redimensionnement. */
  width?: number;
  height?: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly publicApiUrl: string;
  private readonly cloud: CloudinaryConfig | null;
  /** Dossier Cloudinary : tous les fichiers du portfolio y sont rangés. */
  private readonly folder = 'portfolio';

  constructor(config: ConfigService) {
    this.publicApiUrl = config.get('PUBLIC_API_URL', 'http://localhost:4300').replace(/\/+$/, '');
    this.cloud = parseCloudinaryUrl(config.get<string>('CLOUDINARY_URL'));
    this.logger.log(this.cloud ? `Fichiers stockés sur Cloudinary (${this.cloud.cloud})` : `Fichiers stockés sur le disque : ${UPLOADS_DIR}`);
  }

  async save(file: Express.Multer.File | undefined, kind: UploadKind): Promise<StoredFile> {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return kind === 'cv' ? this.savePdf(file) : this.saveImage(file, kind);
  }

  /** Photo de profil ou image de projet → WebP. */
  private async saveImage(file: Express.Multer.File, kind: 'photo' | 'project'): Promise<StoredFile> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format non accepté : utilise JPG, PNG, WEBP ou AVIF');
    }
    if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException("L'image dépasse 15 Mo");
    // Le type annoncé par le navigateur peut mentir : on vérifie le vrai contenu du fichier.
    if (!looksLikeImage(file.buffer, file.mimetype)) {
      throw new BadRequestException("Ce fichier n'est pas une image valide");
    }
    const { max, quality } = RESIZE[kind];
    let output: { data: Buffer; info: OutputInfo };
    try {
      output = await sharp(file.buffer, { failOn: 'error' })
        .rotate() // remet droites les photos prises en portrait (orientation EXIF), puis retire les métadonnées
        .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, alphaQuality: 100 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException('Cette image est abîmée ou illisible, essaie avec une autre');
    }
    const name = `${kind}-${randomUUID()}`;
    if (this.cloud) {
      const id = `${this.folder}/${name}`;
      const r = await this.cloudUpload('image', id, output.data);
      return { url: r.url, publicId: `cld:image:${id}`, width: output.info.width, height: output.info.height };
    }
    const stored = await this.write(`${name}.webp`, output.data);
    return { ...stored, width: output.info.width, height: output.info.height };
  }

  /** CV : PDF gardé tel quel, 10 Mo maximum. */
  private async savePdf(file: Express.Multer.File): Promise<StoredFile> {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Le CV doit être un fichier PDF');
    }
    if (file.size > MAX_PDF_BYTES) throw new BadRequestException('Le CV dépasse 10 Mo');
    if (!looksLikePdf(file.buffer)) throw new BadRequestException("Ce fichier n'est pas un PDF valide");
    const name = `cv-${randomUUID()}.pdf`;
    if (this.cloud) {
      // « raw » : le PDF est servi tel quel (les PDF de type « image » sont bloqués par défaut sur l'offre gratuite).
      const id = `${this.folder}/${name}`;
      const r = await this.cloudUpload('raw', id, file.buffer);
      return { url: r.url, publicId: `cld:raw:${id}` };
    }
    return this.write(name, file.buffer);
  }

  private async cloudUpload(resource: 'image' | 'raw', id: string, data: Buffer) {
    try {
      return await cloudinaryUpload(this.cloud!, resource, id, data);
    } catch (err) {
      this.logger.error(`Envoi Cloudinary échoué : ${(err as Error).message}`);
      throw new BadRequestException("L'envoi du fichier a échoué, réessaie dans un instant");
    }
  }

  private async write(name: string, data: Buffer): Promise<StoredFile> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(join(UPLOADS_DIR, name), data);
    return { url: `${this.publicApiUrl}/uploads/${name}`, publicId: `local:${name}` };
  }

  /**
   * Retrouve une image de projet déjà envoyée, à partir de son publicId.
   * L'URL et les dimensions sont recalculées ici : on ne fait pas confiance à ce que l'admin renvoie.
   */
  async describeProjectImage(publicId: string): Promise<Required<StoredFile>> {
    if (publicId.startsWith('cld:')) {
      const id = publicId.slice('cld:image:'.length);
      if (!this.cloud || !publicId.startsWith('cld:image:') || !/^portfolio\/project-[\w-]+$/.test(id)) {
        throw new BadRequestException('Image inconnue');
      }
      const r = await cloudinaryImage(this.cloud, id).catch(() => null);
      if (!r) throw new BadRequestException("Cette image n'existe plus sur Cloudinary, renvoie-la");
      return { url: r.url, publicId, width: r.width, height: r.height };
    }
    const name = publicId.startsWith('local:') ? publicId.slice(6) : '';
    if (!/^project-[\w-]+\.webp$/.test(name)) throw new BadRequestException('Image inconnue');
    let data: Buffer;
    try {
      data = await readFile(join(UPLOADS_DIR, name));
    } catch {
      throw new BadRequestException("Cette image n'existe plus sur le serveur, renvoie-la");
    }
    // Lu depuis la mémoire : sharp(chemin) garde le fichier ouvert et Windows refuse ensuite de le supprimer.
    const meta = await sharp(data).metadata();
    return { url: `${this.publicApiUrl}/uploads/${name}`, publicId, width: meta.width ?? 0, height: meta.height ?? 0 };
  }

  /** Supprime un fichier. N'échoue jamais : un fichier orphelin n'est pas grave. */
  async remove(publicId: string | null | undefined): Promise<void> {
    const cld = publicId?.match(/^cld:(image|raw):(.+)$/);
    if (cld) {
      if (!this.cloud) return;
      try {
        await cloudinaryDestroy(this.cloud, cld[1] as 'image' | 'raw', cld[2]);
      } catch (err) {
        this.logger.warn(`Fichier Cloudinary non supprimé (${publicId}) : ${(err as Error).message}`);
      }
      return;
    }
    if (!publicId?.startsWith('local:')) return;
    const name = publicId.slice(6);
    if (!/^[\w.-]+$/.test(name)) return;
    try {
      await unlink(join(UPLOADS_DIR, name));
    } catch (err) {
      this.logger.warn(`Fichier non supprimé (${publicId}) : ${(err as Error).message}`);
    }
  }
}
