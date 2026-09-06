const fs = require('fs');
const {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const res = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.substring(1, v.length - 1);
      }
      res[trimmed.substring(0, idx).trim()] = v;
    }
  }
  return res;
}

const envR2 = parseEnv('.env.r2.local');

const accessKeyId =
  process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID ||
  envR2.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY ||
  envR2.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY;

const endpoint =
  process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT ||
  envR2.CLOUDFLARE_R2_PRIVATE_ENDPOINT;

const bucketName =
  process.env.CLOUDFLARE_R2_PRIVATE_BUCKET ||
  envR2.CLOUDFLARE_R2_PRIVATE_BUCKET ||
  'haxr-private-uploads';

async function validateCredential() {
  console.log('=== VALIDATING NEW PRIVATE R2 CREDENTIAL ===');
  console.log('Target Bucket:', bucketName);
  console.log('Endpoint host:', new URL(endpoint).host);

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Private R2 credentials missing in .env.r2.local');
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // 1. HeadBucket
  console.log('1. HeadBucket...');
  await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
  console.log('   HeadBucket: OK');

  // 2. ListObjectsV2
  console.log('2. ListObjectsV2...');
  const listRes = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
    })
  );
  console.log(`   ListObjectsV2: OK (existing object count: ${listRes.KeyCount ?? 0})`);
  if (listRes.Contents && listRes.Contents.length > 0) {
    console.log('   Existing keys:', listRes.Contents.map(c => c.Key));
  }

  // 3. Isolated temporary object permission test
  const testKey = `_system_test/perm_check_${Date.now()}.txt`;
  const testPayload = Buffer.from('HAXR_PRIVATE_STORAGE_CREDENTIAL_VERIFICATION_PASS');
  console.log(`3. Temporary Object Permission Test (${testKey})...`);

  // PUT
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testPayload,
      ContentType: 'text/plain',
    })
  );
  console.log('   PUT synthetic test object: OK');

  // HEAD
  const headRes = await s3.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    })
  );
  console.log(`   HEAD test object: OK (ContentLength: ${headRes.ContentLength})`);

  // GET
  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    })
  );
  const getBytes = await getRes.Body.transformToByteArray();
  const getBuffer = Buffer.from(getBytes);
  if (getBuffer.toString('utf8') !== testPayload.toString('utf8')) {
    throw new Error('GET payload content mismatch');
  }
  console.log('   GET test object payload verified: OK');

  // DELETE
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    })
  );
  console.log('   DELETE test object: OK');

  // Verify deletion
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    throw new Error('Test object still exists after DELETE');
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log('   Deletion confirmed (404 NotFound): OK');
    } else {
      throw err;
    }
  }

  console.log('\nHAXRWEB_PRIVATE_R2_CREDENTIAL_READY=true');
}

validateCredential().catch(err => {
  console.error('ERRO NA VALIDAÇÃO DE CREDENCIAIS R2:', err);
  process.exit(1);
});
