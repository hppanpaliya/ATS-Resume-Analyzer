import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { FileStorageService, FileMetadata } from './file-storage.service';

export interface ProcessedResume {
  text: string;
  structuredData?: any;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    characterCount: number;
    extractedAt: Date;
  };
}

export interface ResumeFileData {
  originalFile: FileMetadata;
  processedContent: ProcessedResume;
  structuredData?: any; // For future template system
}

export class ResumeFileService {
  constructor(private fileStorage: FileStorageService) {}

  async processResumeFile(file: Express.Multer.File, userId: string): Promise<ResumeFileData> {
    console.log('Processing resume file:', { userId, filename: file.originalname, size: file.size });
    // Save the original file
    const fileMetadata = await this.fileStorage.saveFile(file, userId);
    console.log('File saved with metadata:', fileMetadata);

    // Extract text based on file type
    const processedContent = await this.extractTextFromFile(file, fileMetadata);

    return {
      originalFile: fileMetadata,
      processedContent,
      structuredData: processedContent.structuredData
    };
  }

  private async extractTextFromFile(
    file: Express.Multer.File,
    metadata: FileMetadata
  ): Promise<ProcessedResume> {
    const buffer = file.buffer;
    let text = '';
    let structuredData: any = null;
    let pageCount: number | undefined;

    try {
      switch (metadata.mimeType) {
        case 'application/pdf':
          const pdfData = await pdfParse(buffer);
          text = pdfData.text;
          pageCount = pdfData.numpages;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docxResult = await mammoth.extractRawText({ buffer });
          text = docxResult.value;
          break;

        case 'text/plain':
        case 'application/rtf':
          text = buffer.toString('utf-8');
          break;

        default:
          // Try to extract as plain text
          text = buffer.toString('utf-8');
          break;
      }

      // Try to parse as JSON for structured data (future template system)
      try {
        structuredData = JSON.parse(text);
        // If it's valid JSON, use it as structured data and extract text from it
        if (structuredData && typeof structuredData === 'object') {
          text = this.extractTextFromStructuredData(structuredData);
        }
      } catch {
        // Not JSON, continue with extracted text
      }

    } catch (error) {
      console.error('Error extracting text from file:', error);
      text = 'Error extracting text from file';
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;

    return {
      text: text.trim(),
      structuredData,
      metadata: {
        pageCount,
        wordCount,
        characterCount,
        extractedAt: new Date()
      }
    };
  }

  private extractTextFromStructuredData(data: any): string {
    // Extract readable text from structured resume data
    const sections: string[] = [];

    if (data.personalInfo) {
      const { fullName, email, phone, location } = data.personalInfo;
      sections.push(`${fullName || 'Name'}`);
      if (email) sections.push(`Email: ${email}`);
      if (phone) sections.push(`Phone: ${phone}`);
      if (location) sections.push(`Location: ${location}`);
    }

    if (data.summary) {
      sections.push(`SUMMARY\n${data.summary}`);
    }

    if (data.experience && Array.isArray(data.experience)) {
      sections.push('EXPERIENCE');
      data.experience.forEach((exp: any) => {
        sections.push(`${exp.position || 'Position'} at ${exp.company || 'Company'}`);
        sections.push(`${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}`);
        if (exp.description) sections.push(exp.description);
      });
    }

    if (data.education && Array.isArray(data.education)) {
      sections.push('EDUCATION');
      data.education.forEach((edu: any) => {
        sections.push(`${edu.degree || 'Degree'} from ${edu.school || 'School'}`);
        if (edu.graduationDate) sections.push(`Graduated: ${edu.graduationDate}`);
      });
    }

    if (data.skills && Array.isArray(data.skills)) {
      sections.push(`SKILLS\n${data.skills.join(', ')}`);
    }

    return sections.join('\n\n');
  }

  async getResumeFile(fileId: string, userId: string): Promise<Buffer | null> {
    return this.fileStorage.getFile(fileId, userId);
  }

  async getResumeFileMetadata(fileId: string, userId: string): Promise<FileMetadata | null> {
    return this.fileStorage.getFileMetadata(fileId, userId);
  }

  async deleteResumeFile(fileId: string, userId: string): Promise<boolean> {
    return this.fileStorage.deleteFile(fileId, userId);
  }

  // Utility method to determine if content is structured
  isStructuredResume(content: any): boolean {
    if (typeof content === 'object' && content !== null) {
      // Check for common resume structure indicators
      const hasPersonalInfo = content.personalInfo && typeof content.personalInfo === 'object';
      const hasExperience = content.experience && Array.isArray(content.experience);
      const hasEducation = content.education && Array.isArray(content.education);
      const hasSkills = content.skills && Array.isArray(content.skills);

      return hasPersonalInfo || hasExperience || hasEducation || hasSkills;
    }
    return false;
  }

  // Convert structured data back to formatted text
  structuredToText(structuredData: any): string {
    if (!structuredData || typeof structuredData !== 'object') {
      return '';
    }
    return this.extractTextFromStructuredData(structuredData);
  }
}