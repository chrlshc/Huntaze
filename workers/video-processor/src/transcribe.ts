import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { uploadToS3 } from './s3';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET!;

const transcribeClient = new TranscribeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  words: TranscriptionWord[];
}

export async function transcribeVideo(
  inputPath: string,
  jobId: string
): Promise<TranscriptionResult> {
  // Extract audio from video for transcription
  const audioPath = inputPath.replace('.mp4', '.mp3');
  await extractAudio(inputPath, audioPath);

  // Upload audio to S3 for Transcribe
  const audioS3Key = `temp/transcribe/${jobId}/audio.mp3`;
  await uploadToS3(audioPath, audioS3Key);

  // Start transcription job
  const transcribeJobName = `huntaze-${jobId}-${Date.now()}`;
  
  await transcribeClient.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: transcribeJobName,
      LanguageCode: 'en-US',
      MediaFormat: 'mp3',
      Media: {
        MediaFileUri: `s3://${BUCKET}/${audioS3Key}`,
      },
      OutputBucketName: BUCKET,
      OutputKey: `temp/transcribe/${jobId}/output.json`,
      Settings: {
        ShowSpeakerLabels: false,
        ShowAlternatives: false,
      },
    })
  );

  // Poll for completion
  let status: TranscriptionJobStatus | undefined;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (attempts < maxAttempts) {
    const response = await transcribeClient.send(
      new GetTranscriptionJobCommand({
        TranscriptionJobName: transcribeJobName,
      })
    );

    status = response.TranscriptionJob?.TranscriptionJobStatus;

    if (status === 'COMPLETED') {
      break;
    }

    if (status === 'FAILED') {
      throw new Error(
        `Transcription failed: ${response.TranscriptionJob?.FailureReason}`
      );
    }

    await sleep(5000);
    attempts++;
  }

  if (status !== 'COMPLETED') {
    throw new Error('Transcription timed out');
  }

  // Get transcription result
  const resultResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: `temp/transcribe/${jobId}/output.json`,
    })
  );

  const resultText = await streamToString(resultResponse.Body as NodeJS.ReadableStream);
  const result = JSON.parse(resultText);

  // Parse AWS Transcribe format
  const words: TranscriptionWord[] = [];
  const items = result.results?.items || [];

  for (const item of items) {
    if (item.type === 'pronunciation') {
      words.push({
        word: item.alternatives?.[0]?.content || '',
        startTime: parseFloat(item.start_time || '0'),
        endTime: parseFloat(item.end_time || '0'),
        confidence: parseFloat(item.alternatives?.[0]?.confidence || '0'),
      });
    }
  }

  const fullText = result.results?.transcripts?.[0]?.transcript || '';

  // Cleanup temp audio
  await fs.promises.unlink(audioPath).catch(() => {});

  return { text: fullText, words };
}

async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  const { spawn } = await import('child_process');

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '16000',
      '-ac', '1',
      outputPath,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => { stderr += data; });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Audio extraction failed: ${stderr}`));
        return;
      }
      resolve();
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}
