import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const BUCKET = config.aws.s3BucketName;

/**
 * Upload a buffer to S3 and return the public URL.
 * @param buffer - file bytes
 * @param originalName - original file name (for extension)
 * @param folder - S3 folder prefix (e.g. "avatars", "submissions")
 * @param contentType - MIME type
 */
export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  folder: string,
  contentType: string,
): Promise<string> {
  const ext = originalName.split('.').pop() || 'bin';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `https://${BUCKET}.s3.${config.aws.region}.amazonaws.com/${key}`;
}
