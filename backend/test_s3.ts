import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

async function main() {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: process.env.AWS_S3_BUCKET_NAME }));
    console.log("SUCCESS:", data.Contents ? data.Contents.length : 0, "objects found.");
  } catch (err) {
    console.error("ERROR CONNECTING TO S3:", err);
  }
}
main();
