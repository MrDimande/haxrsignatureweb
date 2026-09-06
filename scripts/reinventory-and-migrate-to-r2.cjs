const fs = require('fs');
const crypto = require('crypto');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

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

const envLocal = parseEnv('.env.local');
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

if (!accessKeyId || !secretAccessKey || !endpoint) {
  console.error('Private R2 credentials missing in .env.r2.local');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Supabase admin credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);
const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

// Recursively list all files in a Supabase storage bucket
async function listAllFiles(bucket, folder = '') {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    // If bucket doesn't exist or error, return empty
    console.warn(`Aviso ao listar bucket '${bucket}' (pasta '${folder}'): ${error.message}`);
    return [];
  }

  let files = [];
  for (const item of data) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null || !item.metadata) {
      // It's a folder/prefix
      const subFiles = await listAllFiles(bucket, itemPath);
      files = files.concat(subFiles);
    } else {
      files.push({
        bucket,
        name: item.name,
        path: itemPath,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || 'application/octet-stream',
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }
  }
  return files;
}

async function runInitialMigration() {
  console.log('=== STEP 3: RE-INVENTORY SUPABASE ACTIVE STORAGE & COPY TO R2 ===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Target R2 Bucket:', bucketName);

  // Check all relevant buckets
  const targetBuckets = ['concierge-uploads', 'haxr-concierge', 'portal-proofs'];
  const inventory = {};
  let totalActiveObjects = 0;
  let totalActiveBytes = 0;

  for (const b of targetBuckets) {
    const files = await listAllFiles(b);
    inventory[b] = files;
    console.log(`Bucket '${b}': ${files.length} ficheiro(s)`);
    for (const f of files) {
      console.log(`  - [${b}] ${f.path} (${f.size} bytes, ${f.mimetype})`);
      totalActiveObjects++;
      totalActiveBytes += f.size;
    }
  }

  console.log(`\nTotal de objectos activos na origem: ${totalActiveObjects} (${totalActiveBytes} bytes)`);

  // Ensure scratch dir exists
  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch', { recursive: true });
  }

  // Save live inventory snapshot
  fs.writeFileSync('scratch/live-supabase-inventory-before-copy.json', JSON.stringify(inventory, null, 2));

  // Copy each object to R2
  console.log('\n=== INICIANDO TRANSFERÊNCIA FÍSICA PARA R2 ===');
  const migrationResults = [];

  for (const b of targetBuckets) {
    const files = inventory[b] || [];
    for (const file of files) {
      console.log(`\nA copiar: [${b}] ${file.path} (${file.size} bytes)...`);

      // 1. Download from Supabase
      const { data, error } = await supabase.storage.from(b).download(file.path);
      if (error || !data) {
        throw new Error(`Falha ao descarregar ${b}/${file.path} do Supabase: ${error?.message}`);
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const sourceSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      const sourceMd5 = crypto.createHash('md5').update(buffer).digest('hex');

      if (buffer.length !== file.size) {
        console.warn(`Nota: tamanho descarregado (${buffer.length}) difere dos metadados (${file.size})`);
      }

      // 2. Upload to R2 preserving path, content-type, bytes
      const putCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: file.path,
        Body: buffer,
        ContentType: file.mimetype,
      });

      await s3.send(putCmd);
      console.log(`  -> Carregado no R2: ${bucketName}/${file.path}`);

      // 3. Immediate read-back and verification
      const getCmd = new GetObjectCommand({
        Bucket: bucketName,
        Key: file.path,
      });

      const getRes = await s3.send(getCmd);
      const r2Bytes = await getRes.Body.transformToByteArray();
      const r2Buffer = Buffer.from(r2Bytes);
      const r2Sha256 = crypto.createHash('sha256').update(r2Buffer).digest('hex');

      if (r2Buffer.length !== buffer.length) {
        throw new Error(`Tamanho diverge após escrita no R2 para ${file.path}: ${buffer.length} vs ${r2Buffer.length}`);
      }
      if (r2Sha256 !== sourceSha256) {
        throw new Error(`Hash SHA-256 diverge para ${file.path}!`);
      }

      console.log(`  -> Verificação R2 OK: ${r2Buffer.length} bytes, SHA-256: ${r2Sha256}`);

      migrationResults.push({
        sourceBucket: b,
        storagePath: file.path,
        contentType: file.mimetype,
        bytes: r2Buffer.length,
        sha256: r2Sha256,
        md5: sourceMd5,
      });
    }
  }

  // STEP 4: PARITY VERIFICATION
  console.log('\n=== STEP 4: VERIFICAÇÃO DE PARIDADE GLOBAL ===');
  const r2List = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
  const r2Objects = r2List.Contents || [];

  console.log(`Total de objectos no R2 (${bucketName}): ${r2Objects.length}`);

  const sourcePaths = new Set();
  for (const b of targetBuckets) {
    for (const f of inventory[b] || []) {
      sourcePaths.add(f.path);
    }
  }

  const r2Paths = new Set(r2Objects.map(o => o.Key));

  let sourceOnly = 0;
  for (const p of sourcePaths) {
    if (!r2Paths.has(p)) sourceOnly++;
  }

  let targetOnly = 0;
  for (const p of r2Paths) {
    if (!sourcePaths.has(p)) targetOnly++;
  }

  let sizeMismatch = 0;
  for (const m of migrationResults) {
    const r2Obj = r2Objects.find(o => o.Key === m.storagePath);
    if (!r2Obj || r2Obj.Size !== m.bytes) {
      sizeMismatch++;
    }
  }

  console.log(`sourceOnly   = ${sourceOnly}`);
  console.log(`targetOnly   = ${targetOnly}`);
  console.log(`sizeMismatch = ${sizeMismatch}`);

  for (const m of migrationResults) {
    console.log(`Objecto: ${m.storagePath}`);
    console.log(`  bytes:   ${m.bytes}`);
    console.log(`  SHA-256: ${m.sha256}`);
  }

  if (sourceOnly === 0 && targetOnly === 0 && sizeMismatch === 0) {
    console.log('\nHAXRWEB_STORAGE_INITIAL_PARITY=true');
  } else {
    throw new Error('Falha na paridade inicial!');
  }

  fs.writeFileSync(
    'scratch/migration-initial-parity.json',
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        bucketName,
        sourceOnly,
        targetOnly,
        sizeMismatch,
        migrationResults,
        initialParity: true,
      },
      null,
      2
    )
  );
}

runInitialMigration().catch(err => {
  console.error('ERRO NA MIGRAÇÃO INICIAL:', err);
  process.exit(1);
});
