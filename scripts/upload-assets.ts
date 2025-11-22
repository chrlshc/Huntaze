#!/usr/bin/env ts-node

/**
 * Upload Static Assets to S3
 * 
 * This script uploads static assets from the Next.js build to S3 with proper
 * content-type headers and caching policies.
 * 
 * Usage:
 *   npm run upload-assets
 *   npm run upload-assets -- --dry-run
 *   npm run upload-assets -- --path public/images
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { createHash } from 'crypto';

// Configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'huntaze-beta-assets';
const REGION = process.env.AWS_REGION || 'us-east-1';
const DRY_RUN = process.argv.includes('--dry-run');
const CUSTOM_PATH = process.argv.find(arg => arg.startsWith('--path='))?.split('=')[1];

// Initialize S3 client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Content-Type mapping for common file types
const CONTENT_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  
  // Documents
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.xml': 'application/xml',
  
  // Web assets
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.html': 'text/html',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  
  // Media
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

// Cache-Control policies based on file type
const CACHE_POLICIES: Record<string, string> = {
  // Immutable assets (with hash in filename)
  immutable: 'public, max-age=31536000, immutable',
  
  // Long-lived assets
  longLived: 'public, max-age=2592000', // 30 days
  
  // Short-lived assets
  shortLived: 'public, max-age=3600', // 1 hour
  
  // No cache
  noCache: 'no-cache, no-store, must-revalidate',
};

interface UploadStats {
  total: number;
  uploaded: number;
  skipped: number;
  failed: number;
  totalSize: number;
}

/**
 * Get content type for file
 */
function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

/**
 * Get cache control policy for file
 */
function getCacheControl(filePath: string): string {
  const filename = filePath.toLowerCase();
  
  // Immutable assets (Next.js build files with hash)
  if (filename.includes('/_next/static/') || /\.[a-f0-9]{8,}\.(js|css|woff2?)$/.test(filename)) {
    return CACHE_POLICIES.immutable;
  }
  
  // Images and fonts
  if (/\.(jpg|jpeg|png|gif|webp|avif|woff2?|ttf|otf)$/.test(filename)) {
    return CACHE_POLICIES.longLived;
  }
  
  // HTML and JSON
  if (/\.(html|json)$/.test(filename)) {
    return CACHE_POLICIES.shortLived;
  }
  
  // Default
  return CACHE_POLICIES.longLived;
}

/**
 * Calculate MD5 hash of file
 */
function calculateMD5(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('md5').update(content).digest('base64');
}

/**
 * Check if file needs to be uploaded (compare MD5)
 */
async function needsUpload(key: string, localPath: string): Promise<boolean> {
  try {
    const localMD5 = calculateMD5(localPath);
    
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(headCommand);
    const remoteMD5 = response.ETag?.replace(/"/g, '');
    
    return localMD5 !== remoteMD5;
  } catch (error: any) {
    // File doesn't exist in S3, needs upload
    if (error.name === 'NotFound') {
      return true;
    }
    throw error;
  }
}

/**
 * Upload file to S3
 */
async function uploadFile(localPath: string, s3Key: string): Promise<void> {
  const content = readFileSync(localPath);
  const contentType = getContentType(localPath);
  const cacheControl = getCacheControl(localPath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: content,
    ContentType: contentType,
    CacheControl: cacheControl,
    Metadata: {
      'uploaded-at': new Date().toISOString(),
      'original-path': localPath,
    },
  });
  
  await s3Client.send(command);
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);
  
  files.forEach((file) => {
    const filePath = join(dirPath, file);
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

/**
 * Main upload function
 */
async function uploadAssets(): Promise<void> {
  console.log('🚀 Huntaze Asset Upload Script');
  console.log('================================\n');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${REGION}`);
  console.log(`Dry Run: ${DRY_RUN ? 'Yes' : 'No'}\n`);
  
  // Determine paths to upload
  const pathsToUpload = CUSTOM_PATH 
    ? [CUSTOM_PATH]
    : [
        'public',
        '.next/static',
      ];
  
  const stats: UploadStats = {
    total: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    totalSize: 0,
  };
  
  for (const basePath of pathsToUpload) {
    console.log(`📁 Processing: ${basePath}`);
    
    try {
      const files = getAllFiles(basePath);
      stats.total += files.length;
      
      for (const filePath of files) {
        const relativePath = relative(process.cwd(), filePath);
        const s3Key = relativePath.replace(/\\/g, '/'); // Windows path fix
        const fileSize = statSync(filePath).size;
        stats.totalSize += fileSize;
        
        try {
          // Check if upload is needed
          const shouldUpload = await needsUpload(s3Key, filePath);
          
          if (!shouldUpload) {
            console.log(`⏭️  Skipped (unchanged): ${s3Key}`);
            stats.skipped++;
            continue;
          }
          
          if (DRY_RUN) {
            console.log(`[DRY RUN] Would upload: ${s3Key} (${(fileSize / 1024).toFixed(2)} KB)`);
            stats.uploaded++;
          } else {
            await uploadFile(filePath, s3Key);
            console.log(`✅ Uploaded: ${s3Key} (${(fileSize / 1024).toFixed(2)} KB)`);
            stats.uploaded++;
          }
        } catch (error: any) {
          console.error(`❌ Failed: ${s3Key} - ${error.message}`);
          stats.failed++;
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${basePath}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Print summary
  console.log('================================');
  console.log('📊 Upload Summary');
  console.log('================================');
  console.log(`Total files: ${stats.total}`);
  console.log(`Uploaded: ${stats.uploaded}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  
  if (stats.failed > 0) {
    console.error('⚠️  Some uploads failed. Please check the errors above.');
    process.exit(1);
  }
  
  if (DRY_RUN) {
    console.log('ℹ️  This was a dry run. No files were actually uploaded.');
    console.log('   Run without --dry-run to perform the upload.');
  } else {
    console.log('✅ All assets uploaded successfully!');
  }
}

// Run the script
uploadAssets().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
