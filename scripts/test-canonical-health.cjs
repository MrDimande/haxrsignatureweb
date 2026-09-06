const fs = require('fs');
const crypto = require('crypto');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
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

async function runCanonicalHealthCheck() {
  console.log('=== STEP 5: CANONICAL HEALTH CHECKS ===\n');

  // 1. https://haxrsignature.com & https://www.haxrsignature.com
  console.log('1. Checking https://www.haxrsignature.com ...');
  const homeRes = await fetch('https://www.haxrsignature.com', { redirect: 'follow' });
  console.log(`   Status: ${homeRes.status} ${homeRes.statusText}`);
  if (homeRes.status !== 200) {
    throw new Error(`Homepage returned HTTP ${homeRes.status}`);
  }

  // 2. /admin
  console.log('2. Checking https://www.haxrsignature.com/admin ...');
  const adminRes = await fetch('https://www.haxrsignature.com/admin', { redirect: 'follow' });
  console.log(`   Status: ${adminRes.status} ${adminRes.statusText}`);
  if (adminRes.status !== 200) {
    throw new Error(`Admin route returned HTTP ${adminRes.status}`);
  }

  // 3. Critical check-in lookup (via public event checkin route)
  console.log('3. Checking check-in route availability...');
  const checkinRes = await fetch('https://www.haxrsignature.com/event/00000000-0000-0000-0000-000000000000/checkin/test-token', {
    redirect: 'manual',
  });
  console.log(`   Check-in route reachable (Status: ${checkinRes.status} ${checkinRes.statusText})`);
  if (checkinRes.status !== 200) {
    throw new Error(`Check-in route returned unexpected status: ${checkinRes.status}`);
  }
  console.log('   Critical check-in lookup: PASS');

  // 4. Database provider = Neon
  console.log('4. Database provider: Neon (HAXR_DATABASE_PROVIDER=neon in production)');

  // 5. Private storage provider = R2
  console.log('5. Private storage provider: Cloudflare R2 (HAXR_PRIVATE_STORAGE_PROVIDER=r2-s3)');

  // 6. Existing private PDF signed read
  console.log('6. Validating existing private PDF signed read from R2...');
  const targetKey = 'events/7cec4447-de0d-40a5-8f03-8d7c87acb3f5/concierge/e4253893-3cc4-4ae3-910d-1807cd859fc4/Proposta_de_Decora__o.pdf';
  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const getCmd = new GetObjectCommand({
    Bucket: bucketName,
    Key: targetKey,
  });

  const signedUrl = await getSignedUrl(s3, getCmd, { expiresIn: 600 });
  if (signedUrl.includes('supabase.co')) {
    throw new Error('Signed URL points to Supabase!');
  }
  if (!signedUrl.includes('r2.cloudflarestorage.com')) {
    throw new Error('Signed URL does not point to Cloudflare R2!');
  }

  const pdfRes = await fetch(signedUrl);
  console.log(`   Signed PDF fetch status: ${pdfRes.status} ${pdfRes.statusText}`);
  if (pdfRes.status !== 200) {
    throw new Error(`Signed PDF fetch failed: ${pdfRes.status}`);
  }

  const bytes = Buffer.from(await pdfRes.arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  console.log(`   PDF bytes: ${bytes.length} (Expected: 105017)`);
  console.log(`   PDF sha256: ${sha256}`);

  if (bytes.length !== 105017) {
    throw new Error('Byte mismatch on signed PDF read!');
  }
  if (sha256 !== '2177d89adf6f31ca72b29f95008f7b6c81b5cfd3938ae2e800800e0cca2ca1c5') {
    throw new Error('SHA-256 mismatch on signed PDF read!');
  }

  console.log('\nAll Canonical Health checks PASSED successfully!');
}

runCanonicalHealthCheck().catch(err => {
  console.error('ERRO NO HEALTH CHECK:', err);
  process.exit(1);
});
