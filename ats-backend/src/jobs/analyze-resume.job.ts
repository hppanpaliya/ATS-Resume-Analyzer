import Queue from 'bull';
import mammoth from 'mammoth';
import { AIService } from '../services/ai.service';
import { FileStorageService } from '../services/file-storage.service';
import prisma from '../lib/prisma';
import { Logger } from '../utils/logger';
import { AnalysisJobData, AnalysisJobResult, registerAnalysisJobProcessor } from '../queues/analysis.queue';

const aiService = new AIService();
const fileStorage = new FileStorageService();

/**
 * Initialize the analysis job processor
 * Attach handlers to the queue
 */
export const initializeAnalysisJobProcessor = async (): Promise<void> => {
  // Initialize file storage
  await fileStorage.initialize().catch((err) => {
    Logger.error('Failed to initialize file storage:', err);
  });

  /**
   * Main job processor - handles the AI analysis logic
   */
  registerAnalysisJobProcessor(async (job: Queue.Job<AnalysisJobData>) => {
    Logger.info(`Processing analysis job: ${job.id}`);

    const { userId, resumeText, jobDescription, jobTitle, selectedModel, temperature, max_tokens, include_reasoning } = job.data;

    try {
      // Update job progress
      job.progress(10);
      Logger.debug(`Job ${job.id}: Extracting text (10%)`);

      // Extract text from resume
      let text = resumeText;
      if (!text && job.data.fileBuffer && job.data.fileMimeType) {
        Logger.debug(`Job ${job.id}: Extracting text from file`);
        text = await extractTextFromFile(job.data.fileBuffer, job.data.fileMimeType);
        job.progress(25);
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Resume text is too short or could not be extracted');
      }

      // Prepare model parameters
      const modelParameters = {
        temperature,
        max_tokens,
        include_reasoning: include_reasoning || false
      };

      job.progress(30);
      Logger.debug(`Job ${job.id}: Calling AI service (30%)`);

      // Call AI service for analysis
      const analysisResult = await aiService.analyzeResume(
        text,
        jobDescription,
        selectedModel,
        modelParameters
      );

      job.progress(60);
      Logger.debug(`Job ${job.id}: Saving files and data to database (60%)`);

      // Save original file if provided
      let fileMetadata: any = null;
      if (job.data.fileBuffer && job.data.fileName && job.data.fileMimeType) {
        fileMetadata = await fileStorage.saveFile(
          {
            buffer: job.data.fileBuffer,
            originalname: job.data.fileName,
            mimetype: job.data.fileMimeType,
            size: job.data.fileBuffer.length
          } as any,
          userId
        );
        job.progress(70);
      }

      // Save analysis to database in a transaction
      const savedData = await prisma.$transaction(async (tx) => {
        // Create or find job description
        let jobDesc = await tx.jobDescription.findFirst({
          where: {
            userId,
            title: jobTitle
          }
        });

        if (!jobDesc) {
          jobDesc = await tx.jobDescription.create({
            data: {
              userId,
              title: jobTitle,
              description: jobDescription
            }
          });
        } else {
          jobDesc = await tx.jobDescription.update({
            where: { id: jobDesc.id },
            data: {
              description: jobDescription,
              updatedAt: new Date()
            }
          });
        }

        job.progress(75);

        // Create resume record
        const resume = await tx.resume.create({
          data: {
            userId,
            title: `Resume for ${jobTitle}`,
            structuredData: null,
            extractedText: text,
            originalFileId: fileMetadata?.id || null,
            originalFileName: fileMetadata?.originalName || null,
            originalFileSize: fileMetadata?.size || null,
            originalFileType: fileMetadata?.mimeType || null,
            fileProcessedAt: fileMetadata ? new Date() : null,
            status: 'analyzed'
          }
        });

        job.progress(80);

        // Save analysis result
        const analysis = await tx.analysis.create({
          data: {
            userId,
            resumeId: resume.id,
            jobDescriptionId: jobDesc.id,
            analysisType: 'ats_analysis',
            aiProvider: analysisResult.modelUsed?.provider || 'unknown',
            modelUsed: analysisResult.modelUsed?.id || selectedModel || 'unknown',
            results: JSON.stringify(analysisResult),
            status: 'completed',
            completedAt: new Date(),
            processingTimeMs: analysisResult.processingTime || null,
            tokensUsed: analysisResult.tokensUsed || null
          }
        });

        job.progress(90);

        return { jobDesc, resume, analysis };
      });

      job.progress(95);

      const result: AnalysisJobResult = {
        analysisId: savedData.analysis.id,
        resumeId: savedData.resume.id,
        jobDescriptionId: savedData.jobDesc.id,
        overallScore: analysisResult.overallScore,
        status: 'completed'
      };

      Logger.info(`Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Job ${job.id} failed: ${errorMessage}`);
      throw error; // Re-throw to trigger retry mechanism
    }
  });

  Logger.info('Analysis job processor initialized');
};

/**
 * Extract text from PDF or DOCX file
 */
async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      return data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract text from file: ${errorMessage}`);
  }
}

export default {
  initializeAnalysisJobProcessor
};
