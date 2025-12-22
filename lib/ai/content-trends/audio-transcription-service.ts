/**
 * Azure Speech Batch Transcription Service for Content & Trends AI Engine
 * 
 * Provides cost-efficient audio transcription at $0.18/hour using Azure Speech
 * Batch Transcription API with speaker diarization and timestamp alignment.
 * 
 * Features:
 * - Batch transcription for cost efficiency
 * - Speaker diarization (identify different speakers)
 * - Word-level timestamps for timeline analysis
 * - Audio extraction from video files using FFmpeg
 * - Integration with video processing pipeline
 * 
 * Requirements: 3.6, 3.9
 * @see .kiro/specs/content-trends-ai-engine/requirements.md
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { AudioTranscript, TranscriptWord, SpeakerSegment } from './phi4-multimodal-service';
import { ExternalServiceError, mapHttpStatusToExternalCode } from '@/lib/services/external/errors';
import { externalFetch, externalFetchJson } from '@/lib/services/external/http';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BatchTranscriptionJob {
  /** Job ID from Azure */
  jobId: string;
  /** Job status */
  status: TranscriptionJobStatus;
  /** Audio file URL in Azure Blob Storage */
  audioUrl: string;
  /** Created timestamp */
  createdAt: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Duration in seconds */
  durationSeconds?: number;
  /** Estimated cost */
  estimatedCost?: number;
  /** Error message if failed */
  error?: string;
}

export type TranscriptionJobStatus = 
  | 'NotStarted'
  | 'Running'
  | 'Succeeded'
  | 'Failed';

export interface TranscriptionOptions {
  /** Locale for transcription (default: en-US) */
  locale?: string;
  /** Enable speaker diarization */
  diarizationEnabled?: boolean;
  /** Enable word-level timestamps */
  wordLevelTimestampsEnabled?: boolean;
  /** Punctuation mode */
  punctuationMode?: 'None' | 'Dictated' | 'Automatic' | 'DictatedAndAutomatic';
  /** Profanity filter mode */
  profanityFilterMode?: 'None' | 'Removed' | 'Tags' | 'Masked';
  /** Maximum number of speakers for diarization */
  maxSpeakerCount?: number;
}

export interface AudioExtractionResult {
  /** Path to extracted audio file */
  audioPath: string;
  /** Audio duration in seconds */
  durationSeconds: number;
  /** Audio format */
  format: string;
  /** Sample rate */
  sampleRate: number;
  /** Number of channels */
  channels: number;
}

// ============================================================================
// Azure Speech Batch Transcription Service
// ============================================================================

export class AudioTranscriptionService {
  private speechKey: string;
  private speechRegion: string;
  private speechEndpoint: string;
  private apiVersion = '2024-11-15';

  constructor() {
    this.speechKey = process.env.AZURE_SPEECH_KEY || '';
    this.speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus2';
    this.speechEndpoint = process.env.AZURE_SPEECH_ENDPOINT || 
      `https://${this.speechRegion}.api.cognitive.microsoft.com`;
  }

  /**
   * Submit a batch transcription job
   */
  async submitBatchJob(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<BatchTranscriptionJob> {
    if (!this.speechKey) {
      throw new ExternalServiceError({
        service: 'azure-speech',
        code: 'CONFIG_MISSING',
        retryable: false,
        message: 'Azure Speech key not configured (AZURE_SPEECH_KEY)',
      });
    }

    const requestBody = {
      contentUrls: [audioUrl],
      locale: options.locale || 'en-US',
      displayName: `content-trends-${Date.now()}`,
      properties: {
        diarizationEnabled: options.diarizationEnabled ?? true,
        wordLevelTimestampsEnabled: options.wordLevelTimestampsEnabled ?? true,
        punctuationMode: options.punctuationMode || 'DictatedAndAutomatic',
        profanityFilterMode: options.profanityFilterMode || 'Masked',
        ...(options.maxSpeakerCount && { diarization: { maxSpeakers: options.maxSpeakerCount } }),
      },
    };

    const result = await externalFetchJson<any>(
      `${this.speechEndpoint}/speechtotext/v3.2/transcriptions`,
      {
        service: 'azure-speech',
        operation: 'submitBatchJob',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.speechKey,
        },
        body: JSON.stringify(requestBody),
        timeoutMs: 20_000,
        retry: { maxRetries: 0 },
      }
    );
    
    return {
      jobId: result.self.split('/').pop(),
      status: result.status as TranscriptionJobStatus,
      audioUrl,
      createdAt: new Date(result.createdDateTime),
    };
  }

  /**
   * Get the status of a transcription job
   */
  async getTranscriptionStatus(jobId: string): Promise<BatchTranscriptionJob> {
    const result = await externalFetchJson<any>(
      `${this.speechEndpoint}/speechtotext/v3.2/transcriptions/${jobId}`,
      {
        service: 'azure-speech',
        operation: 'getTranscriptionStatus',
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.speechKey,
        },
        timeoutMs: 20_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );
    
    return {
      jobId,
      status: result.status as TranscriptionJobStatus,
      audioUrl: result.contentUrls?.[0] || '',
      createdAt: new Date(result.createdDateTime),
      completedAt: result.lastActionDateTime ? new Date(result.lastActionDateTime) : undefined,
      error: result.properties?.error?.message,
    };
  }

  /**
   * Get the transcription result
   */
  async getTranscriptionResult(jobId: string): Promise<AudioTranscript> {
    // First get the files URL
    const filesResult = await externalFetchJson<any>(
      `${this.speechEndpoint}/speechtotext/v3.2/transcriptions/${jobId}/files`,
      {
        service: 'azure-speech',
        operation: 'getTranscriptionFiles',
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.speechKey,
        },
        timeoutMs: 20_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );
    
    // Find the transcription file
    const transcriptionFile = filesResult.values?.find(
      (f: { kind: string }) => f.kind === 'Transcription'
    );

    if (!transcriptionFile) {
      throw new ExternalServiceError({
        service: 'azure-speech',
        code: 'INVALID_RESPONSE',
        retryable: false,
        message: 'Transcription file not found in job results',
        details: { jobId },
      });
    }

    // Download the transcription
    const transcriptData = await externalFetchJson<any>(
      transcriptionFile.links.contentUrl,
      {
        service: 'azure-speech',
        operation: 'downloadTranscript',
        method: 'GET',
        timeoutMs: 30_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );
    
    return this.parseTranscriptionResult(transcriptData);
  }

  /**
   * Wait for a transcription job to complete
   */
  async waitForCompletion(
    jobId: string,
    pollIntervalMs = 5000,
    maxWaitMs = 600000 // 10 minutes
  ): Promise<BatchTranscriptionJob> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getTranscriptionStatus(jobId);
      
      if (status.status === 'Succeeded' || status.status === 'Failed') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Transcription job ${jobId} timed out after ${maxWaitMs}ms`);
  }

  /**
   * Transcribe audio and wait for result
   */
  async transcribe(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<AudioTranscript> {
    const job = await this.submitBatchJob(audioUrl, options);
    const completedJob = await this.waitForCompletion(job.jobId);
    
    if (completedJob.status === 'Failed') {
      throw new Error(`Transcription failed: ${completedJob.error}`);
    }
    
    return this.getTranscriptionResult(job.jobId);
  }

  /**
   * Extract audio from a video file using FFmpeg
   */
  async extractAudioFromVideo(
    videoPath: string,
    outputPath?: string
  ): Promise<AudioExtractionResult> {
    const output = outputPath || videoPath.replace(/\.[^.]+$/, '.wav');
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',                    // No video
        '-acodec', 'pcm_s16le',   // PCM 16-bit
        '-ar', '16000',           // 16kHz sample rate (optimal for speech)
        '-ac', '1',               // Mono
        '-y',                     // Overwrite output
        output,
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
          return;
        }

        // Get audio duration from FFprobe
        const duration = await this.getAudioDuration(output);
        
        resolve({
          audioPath: output,
          durationSeconds: duration,
          format: 'wav',
          sampleRate: 16000,
          channels: 1,
        });
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      });
    });
  }

  /**
   * Get audio duration using FFprobe
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioPath,
      ]);

      let stdout = '';
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          resolve(0);
          return;
        }
        resolve(parseFloat(stdout.trim()) || 0);
      });

      ffprobe.on('error', () => {
        resolve(0);
      });
    });
  }

  /**
   * Calculate estimated cost for transcription
   */
  calculateCost(durationSeconds: number): number {
    const hours = durationSeconds / 3600;
    return hours * 0.18; // $0.18/hour
  }

  /**
   * Delete a transcription job
   */
  async deleteJob(jobId: string): Promise<void> {
    const response = await externalFetch(
      `${this.speechEndpoint}/speechtotext/v3.2/transcriptions/${jobId}`,
      {
        service: 'azure-speech',
        operation: 'deleteJob',
        method: 'DELETE',
        headers: {
          'Ocp-Apim-Subscription-Key': this.speechKey,
        },
        timeoutMs: 20_000,
        retry: { maxRetries: 0, retryMethods: [] },
      }
    );

    if (!response.ok && response.status !== 404) {
      const body = await response.text().catch(() => '');
      const mapped = mapHttpStatusToExternalCode(response.status);
      throw new ExternalServiceError({
        service: 'azure-speech',
        code: mapped.code,
        retryable: mapped.retryable,
        status: response.status,
        message: 'Failed to delete transcription job',
        details: body ? { body: body.slice(0, 2_000) } : { jobId },
      });
    }
  }

  /**
   * List all transcription jobs
   */
  async listJobs(top = 100): Promise<BatchTranscriptionJob[]> {
    const result = await externalFetchJson<any>(
      `${this.speechEndpoint}/speechtotext/v3.2/transcriptions?top=${top}`,
      {
        service: 'azure-speech',
        operation: 'listJobs',
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.speechKey,
        },
        timeoutMs: 20_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );
    
    return result.values.map((job: Record<string, unknown>) => ({
      jobId: (job.self as string).split('/').pop(),
      status: job.status as TranscriptionJobStatus,
      audioUrl: (job.contentUrls as string[])?.[0] || '',
      createdAt: new Date(job.createdDateTime as string),
      completedAt: job.lastActionDateTime ? new Date(job.lastActionDateTime as string) : undefined,
    }));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private parseTranscriptionResult(data: TranscriptionData): AudioTranscript {
    const combinedRecognizedPhrases = data.combinedRecognizedPhrases || [];
    const recognizedPhrases = data.recognizedPhrases || [];
    
    // Get full text
    const fullText = combinedRecognizedPhrases
      .map((p: { display: string }) => p.display)
      .join(' ');
    
    // Extract words with timestamps
    const words: TranscriptWord[] = [];
    for (const phrase of recognizedPhrases) {
      if (phrase.nBest?.[0]?.words) {
        for (const word of phrase.nBest[0].words) {
          const wordStart = this.ticksToSeconds(word.offset);
          const wordDuration = this.ticksToSeconds(word.duration);
          words.push({
            word: word.word,
            startTime: wordStart,
            endTime: wordStart + wordDuration,
            confidence: word.confidence || phrase.nBest[0].confidence || 1,
            speakerId: phrase.speaker ? `Speaker_${phrase.speaker}` : undefined,
          });
        }
      }
    }
    
    // Extract speaker segments
    const speakers: SpeakerSegment[] = [];
    let currentSpeaker: string | null = null;
    let segmentStart = 0;
    let segmentText = '';
    
    for (const phrase of recognizedPhrases) {
      const speakerId = phrase.speaker ? `Speaker_${phrase.speaker}` : 'Unknown';
      const phraseStart = this.ticksToSeconds(phrase.offset);
      const phraseDuration = this.ticksToSeconds(phrase.duration);
      const phraseEnd = phraseStart + phraseDuration;
      const phraseText = phrase.nBest?.[0]?.display || '';
      
      if (currentSpeaker !== speakerId) {
        if (currentSpeaker && segmentText) {
          speakers.push({
            speakerId: currentSpeaker,
            startTime: segmentStart,
            endTime: phraseStart,
            text: segmentText.trim(),
          });
        }
        currentSpeaker = speakerId;
        segmentStart = phraseStart;
        segmentText = phraseText;
      } else {
        segmentText += ' ' + phraseText;
      }
    }
    
    // Add last segment
    if (currentSpeaker && segmentText) {
      const lastPhrase = recognizedPhrases[recognizedPhrases.length - 1];
      const lastPhraseStart = this.ticksToSeconds(lastPhrase.offset);
      const lastPhraseDuration = this.ticksToSeconds(lastPhrase.duration);
      speakers.push({
        speakerId: currentSpeaker,
        startTime: segmentStart,
        endTime: lastPhraseStart + lastPhraseDuration,
        text: segmentText.trim(),
      });
    }
    
    // Calculate duration
    const durationSeconds = data.duration 
      ? this.ticksToSeconds(data.duration)
      : (words.length > 0 ? words[words.length - 1].endTime : 0);
    
    return {
      text: fullText,
      words,
      speakers,
      durationSeconds,
    };
  }

  private ticksToSeconds(ticks: number | string): number {
    // Azure Speech uses ISO 8601 duration format or ticks (100ns units)
    if (typeof ticks === 'string') {
      // Parse ISO 8601 duration (e.g., "PT1.5S")
      const match = ticks.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
      if (match) {
        const hours = parseFloat(match[1] || '0');
        const minutes = parseFloat(match[2] || '0');
        const seconds = parseFloat(match[3] || '0');
        return hours * 3600 + minutes * 60 + seconds;
      }
      return 0;
    }
    // Ticks are in 100ns units
    return ticks / 10000000;
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface TranscriptionData {
  combinedRecognizedPhrases?: Array<{ display: string }>;
  recognizedPhrases?: Array<{
    offset: number | string;
    duration: number | string;
    speaker?: number;
    nBest?: Array<{
      display: string;
      confidence: number;
      words?: Array<{
        word: string;
        offset: number | string;
        duration: number | string;
        confidence?: number;
      }>;
    }>;
  }>;
  duration?: number | string;
}

// ============================================================================
// Singleton Export
// ============================================================================

let audioServiceInstance: AudioTranscriptionService | null = null;

export function getAudioTranscriptionService(): AudioTranscriptionService {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioTranscriptionService();
  }
  return audioServiceInstance;
}

export default AudioTranscriptionService;
