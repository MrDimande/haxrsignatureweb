const fs = require('fs');
const crypto = require('crypto');
const {
  S3Client,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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

const targetStoragePath = 'events/7cec4447-de0d-40a5-8f03-8d7c87acb3f5/concierge/e4253893-3cc4-4ae3-910d-1807cd859fc4/Proposta_de_Decora__o.pdf';
const EXPECTED_BYTES = 105017;
const EXPECTED_SHA256 = '2177d89adf6f31ca72b29f95008f7b6c81b5cfd3938ae2e800800e0cca2ca1c5';

async function validateCanonicalRead() {
  console.log('=== STEP 11: CANONICAL READ VALIDATION ===');
  console.log('Target Storage Path:', targetStoragePath);

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: targetStoragePath,
  });

  // Generate private signed URL
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 900 });

  const urlObj = new URL(signedUrl);
  console.log('Generated Signed URL Host:', urlObj.host);

  // Assertions on URL domain
  if (signedUrl.includes('supabase.co')) {
    throw new Error('VIOLATION: Generated URL points to Supabase!');
  }

  if (!urlObj.host.includes('r2.cloudflarestorage.com')) {
    throw new Error(`VIOLATION: Generated URL does not point to Cloudflare R2: ${urlObj.host}`);
  }
  console.log('Signed URL verification: Cloudflare R2 private signed URL confirmed.');

  // Fetch representative file using HTTP GET
  console.log('Fetching file via HTTP GET from R2 signed URL...');
  const res = await fetch(signedUrl);

  console.log('HTTP Status:', res.status, res.statusText);
  if (res.status !== 200 && res.status !== 206) {
    throw new Error(`Expected HTTP 200 or 206, received ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  console.log('Content-Type:', contentType);
  if (!contentType || !contentType.includes('application/pdf')) {
    throw new Error(`Expected Content-Type application/pdf, received ${contentType}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  console.log('Bytes received:   ', buffer.length, `(Expected: ${EXPECTED_BYTES})`);
  console.log('SHA-256 received: ', actualSha256);
  console.log('SHA-256 expected: ', EXPECTED_SHA256);

  if (buffer.length !== EXPECTED_BYTES) {
    throw new Error(`Byte count mismatch: expected ${EXPECTED_BYTES}, got ${buffer.length}`);
  }

  if (actualSha256 !== EXPECTED_SHA256) {
    throw new Error('SHA-256 hash mismatch!');
  }

  console.log('\nCanonical read validation successful:');
  console.log('- HTTP Status: 200 OK');
  console.log('- Content-Type: application/pdf');
  console.log(`- Bytes: ${buffer.length}`);
  console.log('- SHA-256: MATCH');
  console.log('\nHAXRWEB_STORAGE_PROVIDER=R2_CONFIRMED');
}

validateCanonicalRead().catch(err => {
  console.error('ERRO NA VALIDAÇÃO DE LEITURA:', err);
  process.exit(1);
});
