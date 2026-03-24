import Queue from 'bull';
import { createQueue } from '../config/queue.config';
import queueConfig from '../config/queue.config';
import { Logger } from '../utils/logger';

export interface AnalysisJobData {
  userId: string;
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  fileBuffer?: Buffer;
  fileName?: string;
  fileMimeType?: string;
  selectedModel?: string;
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
}

export interface AnalysisJobResult {
  analysisId: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore?: number;
  status: 'completed' | 'failed';
  error?: string;
}

type JobState = 'waiting' | 'active' | 'completed' | 'failed';

type LocalJobRecord = {
  id: string;
  data: AnalysisJobData;
  state: JobState;
  progress: number;
  attemptsMade: number;
  processedOn?: number;
  finishedOn?: number;
  result?: AnalysisJobResult;
  failedReason?: string;
};

type AnalysisProcessor = (job: Queue.Job<AnalysisJobData>) => Promise<AnalysisJobResult>;

let analysisQueue: Queue.Queue<AnalysisJobData> | null = null;
let localProcessor: AnalysisProcessor | null = null;
let localJobCounter = 0;
const localJobs = new Map<string, LocalJobRecord>();

class LocalQueueJob {
  private readonly record: LocalJobRecord;

  constructor(record: LocalJobRecord) {
    this.record = record;
  }

  get id() {
    return this.record.id;
  }

  get data() {
    return this.record.data;
  }

  get attemptsMade() {
    return this.record.attemptsMade;
  }

  get processedOn() {
    return this.record.processedOn;
  }

  get finishedOn() {
    return this.record.finishedOn;
  }

  get returnvalue() {
    return this.record.result;
  }

  get failedReason() {
    return this.record.failedReason;
  }

  progress(value?: number) {
    if (typeof value === 'number') {
      this.record.progress = value;
    }

    return this.record.progress;
  }

  async getState(): Promise<JobState> {
    return this.record.state;
  }
}

const getAnalysisQueue = (): Queue.Queue<AnalysisJobData> => {
  if (!analysisQueue) {
    analysisQueue = createQueue<AnalysisJobData>('resume-analysis', {
      settings: {
        stalledInterval: 5000,
        maxStalledCount: 2,
        lockDuration: 60000,
        lockRenewTime: 30000,
        retryProcessDelay: 5000,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600,
        },
        removeOnFail: false,
      },
    });

    Logger.info('Analysis queue initialized with retry strategy (3 attempts, exponential backoff)');
  }

  return analysisQueue;
};

export const registerAnalysisJobProcessor = (processor: AnalysisProcessor): void => {
  if (queueConfig.useRedis) {
    const queue = getAnalysisQueue();

    queue.process(processor);
    queue.on('completed', (job: Queue.Job) => {
      Logger.info(`Job ${job.id} completed with result:`, job.returnvalue);
    });
    queue.on('failed', (job: Queue.Job, error: Error) => {
      Logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
    });
    queue.on('stalled', (job: Queue.Job) => {
      Logger.warn(`Job ${job.id} stalled and will be retried`);
    });
    return;
  }

  localProcessor = processor;
  Logger.info('Analysis queue running in local in-process mode');
};

const processLocalJob = async (record: LocalJobRecord): Promise<void> => {
  if (!localProcessor) {
    record.state = 'failed';
    record.failedReason = 'Analysis processor not initialized';
    record.finishedOn = Date.now();
    return;
  }

  record.state = 'active';
  record.processedOn = Date.now();

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    record.attemptsMade = attempt;

    try {
      const result = await localProcessor(new LocalQueueJob(record) as unknown as Queue.Job<AnalysisJobData>);
      record.state = 'completed';
      record.result = result;
      record.progress = 100;
      record.finishedOn = Date.now();
      Logger.info(`Local analysis job ${record.id} completed`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      record.failedReason = message;

      if (attempt === maxAttempts) {
        record.state = 'failed';
        record.finishedOn = Date.now();
        Logger.error(`Local analysis job ${record.id} failed after ${attempt} attempts: ${message}`);
        return;
      }
    }
  }
};

export const queueAnalysisJob = async (data: AnalysisJobData): Promise<{ id: string }> => {
  if (queueConfig.useRedis) {
    const queue = getAnalysisQueue();
    const job = await queue.add(data, {
      jobId: `analysis-${data.userId}-${Date.now()}` as any,
      priority: 5,
      delay: 0,
    });

    Logger.info(`Analysis job queued: ${job.id} for user ${data.userId}`);
    return { id: String(job.id) };
  }

  const id = `local-analysis-${Date.now()}-${++localJobCounter}`;
  const record: LocalJobRecord = {
    id,
    data,
    state: 'waiting',
    progress: 0,
    attemptsMade: 0,
  };

  localJobs.set(id, record);
  void Promise.resolve().then(() => processLocalJob(record));
  Logger.info(`Local analysis job queued: ${id} for user ${data.userId}`);
  return { id };
};

export const getJobStatus = async (jobId: string): Promise<{
  id: string;
  state: string;
  progress: number;
  data?: AnalysisJobData;
  result?: AnalysisJobResult;
  failedReason?: string;
  attempt?: number;
  startedAt?: Date;
  finishedAt?: Date;
} | null> => {
  if (queueConfig.useRedis) {
    const queue = getAnalysisQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: String(job.id),
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attempt: job.attemptsMade,
      startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
  }

  const job = localJobs.get(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    state: job.state,
    progress: job.progress,
    data: job.data,
    result: job.result,
    failedReason: job.failedReason,
    attempt: job.attemptsMade,
    startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
  };
};

export const getQueueStats = async (): Promise<{
  active: number;
  delayed: number;
  failed: number;
  waiting: number;
  completed: number;
  paused: number;
}> => {
  if (queueConfig.useRedis) {
    const queue = getAnalysisQueue();

    try {
      const [active, delayed, failed, waiting, completed, paused] = await Promise.all([
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
        queue.getWaitingCount(),
        queue.getCompletedCount(),
        queue.getPausedCount(),
      ]);

      return { active, delayed, failed, waiting, completed, paused };
    } catch (error) {
      Logger.error('Failed to get queue stats:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  const stats = { active: 0, delayed: 0, failed: 0, waiting: 0, completed: 0, paused: 0 };
  for (const job of localJobs.values()) {
    if (job.state === 'active') stats.active += 1;
    if (job.state === 'failed') stats.failed += 1;
    if (job.state === 'waiting') stats.waiting += 1;
    if (job.state === 'completed') stats.completed += 1;
  }
  return stats;
};

export default {
  registerAnalysisJobProcessor,
  queueAnalysisJob,
  getJobStatus,
  getQueueStats,
};
