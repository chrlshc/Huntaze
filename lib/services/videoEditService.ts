import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { s3Service } from './s3Service';
import { mediaAssetsRepository } from '../db/repositories/mediaAssetsRepository';

const execAsync = promisify(exec);

export interface VideoEditOptions {
  trim?: {
    startTime: number;
    endTime: number;
  };
  captions?: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
  thumbnailTimestamp?: number;
}

export const videoEditService = {
  async trimVideo(videoBuffer: Buffer, startTime: number, endTime: number): Promise<Buffer> {
    const tempDir = '/tmp';
    const inputPath = path.join(tempDir, `input-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp4`);

    try {
      await writeFile(inputPath, videoBuffer);
      const duration = endTime - startTime;
      const command = `ffmpeg -i ${inputPath} -ss ${startTime} -t ${duration} -c copy ${outputPath}`;
      await execAsync(command);
      
      const fs = require('fs');
      const trimmedBuffer = fs.readFileSync(outputPath);
      
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      
      return trimmedBuffer;
    } catch (error) {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      throw new Error('Video trimming failed');
    }
  },

  async addCaptions(videoBuffer: Buffer, captions: Array<{ text: string; startTime: number; endTime: number }>): Promise<Buffer> {
    const tempDir = '/tmp';
    const inputPath = path.join(tempDir, `input-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp4`);
    const subtitlePath = path.join(tempDir, `subtitles-${Date.now()}.srt`);

    try {
      await writeFile(inputPath, videoBuffer);

      let srtContent = '';
      captions.forEach((caption, index) => {
        const startSrt = this.secondsToSrtTime(caption.startTime);
        const endSrt = this.secondsToSrtTime(caption.endTime);
        srtContent += `${index + 1}\n${startSrt} --> ${endSrt}\n${caption.text}\n\n`;
      });
      
      await writeFile(subtitlePath, srtContent);
      const command = `ffmpeg -i ${inputPath} -vf "subtitles=${subtitlePath}" ${outputPath}`;
      await execAsync(command);
      
      const fs = require('fs');
      const captionedBuffer = fs.readFileSync(outputPath);
      
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      await unlink(subtitlePath).catch(() => {});
      
      return captionedBuffer;
    } catch (error) {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      await unlink(subtitlePath).catch(() => {});
      throw new Error('Caption addition failed');
    }
  },

  secondsToSrtTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  },

  async saveEditedVideo(userId: string, originalMediaId: string, editedBuffer: Buffer, options: VideoEditOptions): Promise<{ id: string; url: string }> {
    const originalMedia = await mediaAssetsRepository.findById(originalMediaId);
    if (!originalMedia) {
      throw new Error('Original media not found');
    }

    const timestamp = Date.now();
    const newFilename = `edited-${timestamp}-${originalMedia.filename}`;
    const key = s3Service.generateKey(userId, newFilename, 'video');
    const url = await s3Service.upload({
      key,
      body: editedBuffer,
      contentType: 'video/mp4',
      metadata: { userId, originalMediaId, edits: JSON.stringify(options) },
    });

    const newMedia = await mediaAssetsRepository.create({
      userId,
      type: 'video',
      filename: newFilename,
      originalUrl: url,
      sizeBytes: editedBuffer.length,
      mimeType: 'video/mp4',
      metadata: { originalMediaId, edits: options },
    });

    return { id: newMedia.id, url: newMedia.originalUrl };
  },
};
