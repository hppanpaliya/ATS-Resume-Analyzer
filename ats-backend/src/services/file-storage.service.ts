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

  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.config.maxFileSize) {
      return { valid: false, error: `File size exceeds maximum allowed size of ${this.config.maxFileSize / (1024 * 1024)}MB` };
    }

    if (!this.config.allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: `File type ${file.mimetype} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}` };
    }

    return { valid: true };
  }

  async saveFile(file: Express.Multer.File, userId: string): Promise<FileMetadata> {
    console.log('Saving file for user:', userId);
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const validation = this.validateFile(file);
    if (!validation.valid) {
      console.error('File validation failed:', validation.error);
      throw new Error(validation.error);
    }

    const fileId = uuidv4();
    const extension = mime.extension(file.mimetype) || 'bin';
    const filename = `${fileId}.${extension}`;
    const userDir = path.join(this.config.uploadDir, userId);

    console.log('Creating user directory:', userDir);
    // Ensure user directory exists
    await fs.mkdir(userDir, { recursive: true });

    const filePath = path.join(userDir, filename);

    console.log('Saving file to:', filePath);
    // Save file to disk
    try {
      await fs.writeFile(filePath, file.buffer);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const metadata: FileMetadata = {
      id: fileId,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
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
}