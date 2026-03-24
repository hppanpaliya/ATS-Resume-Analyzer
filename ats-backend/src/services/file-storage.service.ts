import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
}

export interface FileStorageConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedTypes: string[];
}

export class FileStorageService {
  private config: FileStorageConfig;

  constructor(config: Partial<FileStorageConfig> = {}) {
    this.config = {
      uploadDir: config.uploadDir || path.join(process.cwd(), 'uploads', 'resumes'),
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedTypes: config.allowedTypes || [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'application/rtf'
      ],
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.access(this.config.uploadDir);
    } catch {
      await fs.mkdir(this.config.uploadDir, { recursive: true });
    }
  }

  validateFile(file: Express.Multer.File): { valid: boolean; error?: string; detectedMimeType?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.config.maxFileSize) {
      return { valid: false, error: `File size exceeds maximum allowed size of ${this.config.maxFileSize / (1024 * 1024)}MB` };
    }

    const detectedMimeType = this.detectMimeType(file.buffer);
    if (!detectedMimeType || !this.config.allowedTypes.includes(detectedMimeType)) {
      return {
        valid: false,
        error: `File content type is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`,
      };
    }

    if (!this.config.allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: `File type ${file.mimetype} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}` };
    }

    return { valid: true, detectedMimeType };
  }

  async saveFile(file: Express.Multer.File, userId: string): Promise<FileMetadata> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const storedMimeType = validation.detectedMimeType || file.mimetype;

    const fileId = uuidv4();
    const extension = mime.extension(storedMimeType) || 'bin';
    const filename = `${fileId}.${extension}`;
    const userDir = path.join(this.config.uploadDir, userId);

    // Ensure user directory exists
    await fs.mkdir(userDir, { recursive: true });

    const filePath = path.join(userDir, filename);

    // Save file to disk
    try {
      await fs.writeFile(filePath, file.buffer);
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const metadata: FileMetadata = {
      id: fileId,
      filename,
      originalName: file.originalname,
      mimeType: storedMimeType,
      size: file.size,
      path: filePath,
      url: `/uploads/resumes/${userId}/${filename}`,
      uploadedAt: new Date()
    };

    return metadata;
  }

  async getFile(fileId: string, userId: string): Promise<Buffer | null> {
    try {
      const userDir = path.join(this.config.uploadDir, userId);
      const files = await fs.readdir(userDir);

      const file = files.find(f => f.startsWith(fileId));
      if (!file) {
        return null;
      }

      const filePath = path.join(userDir, file);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async getFileMetadata(fileId: string, userId: string): Promise<FileMetadata | null> {
    try {
      const userDir = path.join(this.config.uploadDir, userId);
      const files = await fs.readdir(userDir);

      const file = files.find(f => f.startsWith(fileId));
      if (!file) {
        return null;
      }

      const filePath = path.join(userDir, file);
      const stats = await fs.stat(filePath);

      return {
        id: fileId,
        filename: file,
        originalName: file, // We don't store original name, could be enhanced
        mimeType: mime.lookup(file) || 'application/octet-stream',
        size: stats.size,
        path: filePath,
        url: `/uploads/resumes/${userId}/${file}`,
        uploadedAt: stats.birthtime
      };
    } catch {
      return null;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const userDir = path.join(this.config.uploadDir, userId);
      const files = await fs.readdir(userDir);

      const file = files.find(f => f.startsWith(fileId));
      if (!file) {
        return false;
      }

      const filePath = path.join(userDir, file);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteUserFiles(userId: string): Promise<boolean> {
    try {
      const userDir = path.join(this.config.uploadDir, userId);
      await fs.rm(userDir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  getAllowedTypes(): string[] {
    return [...this.config.allowedTypes];
  }

  getMaxFileSize(): number {
    return this.config.maxFileSize;
  }

  private detectMimeType(buffer: Buffer): string | null {
    if (!buffer || buffer.length < 4) {
      return null;
    }

    // PDF: %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }

    // DOCX (ZIP): PK\x03\x04 or PK\x05\x06
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05)) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Legacy DOC (OLE Compound File)
    if (
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1
    ) {
      return 'application/msword';
    }

    // RTF: {\rtf
    if (buffer.length >= 5 && buffer.subarray(0, 5).toString('utf8').toLowerCase() === '{\\rtf') {
      return 'application/rtf';
    }

    if (this.looksLikeText(buffer)) {
      return 'text/plain';
    }

    return null;
  }

  private looksLikeText(buffer: Buffer): boolean {
    const sample = buffer.subarray(0, Math.min(buffer.length, 512));
    let printableCount = 0;

    for (const byte of sample) {
      const isWhitespace = byte === 0x09 || byte === 0x0a || byte === 0x0d;
      const isPrintableAscii = byte >= 0x20 && byte <= 0x7e;
      if (isWhitespace || isPrintableAscii) {
        printableCount += 1;
      }
    }

    return printableCount / sample.length > 0.9;
  }
}
