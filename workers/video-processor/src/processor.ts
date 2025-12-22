import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadFromS3, uploadToS3 } from './s3';
import { transcribeVideo } from './transcribe';
import { generateASSCaptions } from './captions';
import { createDrafts } from './db';

const TEMP_DIR = '/tmp/videos';

interface VideoJobMessage {
  jobId: string;
  s3Key: string;
  userId: string;
  options: {
    autoCaptions: boolean;
    smartCuts: boolean;
    removeWatermark: boolean;
    sendToMarketing: boolean;
  };
  targets: string[];
  variants: number;
  script?: {
    variants: Array<{ hook?: string; body?: string; cta?: string }>;
  };
}

interface ProcessingResult {
  createdContentIds: string[];
  outputs: Array<{
    id: string;
    s3Key: string;
    variant: string;
    duration: number;
  }>;
}

export async function processVideoJob(job: VideoJobMessage): Promise<ProcessingResult> {
  const workDir = path.join(TEMP_DIR, job.jobId);
  await fs.promises.mkdir(workDir, { recursive: true });

  try {
    // 1. Download source video from S3
    console.log(`[${job.jobId}] Downloading source video...`);
    const inputPath = path.join(workDir, 'input.mp4');
    await downloadFromS3(job.s3Key, inputPath);

    // 2. Get video info
    const videoInfo = await getVideoInfo(inputPath);
    console.log(`[${job.jobId}] Video info:`, videoInfo);

    // 3. Transcribe if auto-captions enabled
    let assPath: string | null = null;
    if (job.options.autoCaptions) {
      console.log(`[${job.jobId}] Transcribing video...`);
      const transcription = await transcribeVideo(inputPath, job.jobId);
      
      console.log(`[${job.jobId}] Generating .ASS captions...`);
      assPath = path.join(workDir, 'captions.ass');
      await generateASSCaptions(transcription, assPath);
    }

    // 4. Generate variants (hook cut, main, teaser)
    console.log(`[${job.jobId}] Generating ${job.variants} variants...`);
    const outputs: ProcessingResult['outputs'] = [];

    const variantConfigs = [
      { name: 'hook', startSec: 0, endSec: Math.min(3, videoInfo.duration) },
      { name: 'main', startSec: 0, endSec: videoInfo.duration },
      { name: 'teaser', startSec: 0, endSec: Math.min(15, videoInfo.duration) },
    ].slice(0, job.variants);

    for (const variant of variantConfigs) {
      const outputId = `c_${Date.now()}_${uuidv4().slice(0, 6)}`;
      const outputPath = path.join(workDir, `${variant.name}.mp4`);

      await processVariant({
        inputPath,
        outputPath,
        startSec: variant.startSec,
        endSec: variant.endSec,
        assPath: assPath,
        removeWatermark: job.options.removeWatermark,
      });

      // Upload to S3
      const s3OutputKey = `outputs/${job.userId}/${job.jobId}/${variant.name}.mp4`;
      await uploadToS3(outputPath, s3OutputKey);

      outputs.push({
        id: outputId,
        s3Key: s3OutputKey,
        variant: variant.name,
        duration: variant.endSec - variant.startSec,
      });
    }

    // 5. Create drafts in database
    console.log(`[${job.jobId}] Creating drafts...`);
    const createdContentIds = await createDrafts({
      jobId: job.jobId,
      userId: job.userId,
      outputs,
      targets: job.targets,
      script: job.script,
      sendToMarketing: job.options.sendToMarketing,
    });

    return { createdContentIds, outputs };
  } finally {
    // Cleanup temp files
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

async function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => { stdout += data; });
    ffprobe.stderr.on('data', (data) => { stderr += data; });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        const videoStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
        
        resolve({
          duration: parseFloat(info.format?.duration || '0'),
          width: videoStream?.width || 1080,
          height: videoStream?.height || 1920,
          fps: eval(videoStream?.r_frame_rate || '30/1'),
        });
      } catch (e) {
        reject(new Error(`Failed to parse ffprobe output: ${e}`));
      }
    });
  });
}

interface VariantOptions {
  inputPath: string;
  outputPath: string;
  startSec: number;
  endSec: number;
  assPath: string | null;
  removeWatermark: boolean;
}

async function processVariant(options: VariantOptions): Promise<void> {
  const { inputPath, outputPath, startSec, endSec, assPath, removeWatermark } = options;

  const ffmpegArgs: string[] = [
    '-y',
    '-ss', startSec.toString(),
    '-t', (endSec - startSec).toString(),
    '-i', inputPath,
  ];

  // Build video filter chain
  const vfFilters: string[] = [];

  // Remove watermark (delogo filter for common watermark positions)
  if (removeWatermark) {
    // Top-right corner watermark removal (common for TikTok)
    vfFilters.push('delogo=x=W-150:y=10:w=140:h=50');
  }

  // Burn in captions with libass
  if (assPath) {
    // Escape path for ffmpeg filter
    const escapedPath = assPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');
    vfFilters.push(`subtitles='${escapedPath}'`);
  }

  if (vfFilters.length > 0) {
    ffmpegArgs.push('-vf', vfFilters.join(','));
  }

  // Output settings
  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    outputPath,
  );

  return new Promise((resolve, reject) => {
    console.log(`Running ffmpeg:`, ffmpegArgs.join(' '));
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => { stderr += data; });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg failed (code ${code}): ${stderr}`));
        return;
      }
      resolve();
    });
  });
}
