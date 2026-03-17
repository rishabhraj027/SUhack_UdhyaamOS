import { uploadToS3 } from './src/services/s3.js';

async function main() {
  try {
    const url = await uploadToS3(Buffer.from('hello world'), 'test.txt', 'avatars', 'text/plain');
    console.log("SUCCESS URL:", url);
  } catch (err) {
    console.error("ERROR UPLOADING TO S3:", err);
  }
}
main();
