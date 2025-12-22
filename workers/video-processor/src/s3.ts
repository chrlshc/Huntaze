import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { Readable } from 'stream';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET;

if (!BUCKET) {
  console.error('S3_BUCKET environment variable is required');
  process.exit(1);
}

const s3Client = new S3Client({ region: REGION });

export async function downloadFromS3(s3Key: string, localPath: string): Promise<void> {
  console.log(`Downloading s3://${BUCKET}/${s3Key} to ${localPath}`);

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
    })
  );

  if (!response.Body) {
    throw new Error('Empty response body from S3');
  }

  const writeStream = fs.createWriteStream(localPath);
  const readStream = response.Body as Readable;

  return new Promise((resolve, reject) => {
    readStream.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.on('error', reject);
  });
}

export async function uploadToS3(localPath: string, s3Key: string): Promise<string> {
  console.log(`Uploading ${localPath} to s3://${BUCKET}/${s3Key}`);

  const fileStream = fs.createReadStream(localPath);
  const stats = await fs.promises.stat(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: fileStream,
      ContentLength: stats.size,
      ContentType: 'video/mp4',
    })
  );

  return `s3://${BUCKET}/${s3Key}`;
}

export function getS3Url(s3Key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
}
