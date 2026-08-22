import fs from "fs";
import logger from "./logger";

// S3 types are imported dynamically at runtime — no static dependency

function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT || "";
  return {
    region: process.env.S3_REGION || "ap-southeast-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    bucket: process.env.S3_BUCKET || "",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };
}

export function isS3Enabled(): boolean {
  const cfg = getS3Config();
  return !!cfg.accessKeyId && !!cfg.secretAccessKey && !!cfg.bucket;
}

let _client: any = null;
let _bucket: string | null = null;

async function getClient(): Promise<{ client: any; bucket: string } | null> {
  if (_client && _bucket) return { client: _client, bucket: _bucket };

  const cfg = getS3Config();
  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket) {
    return null;
  }

  try {
    const { S3Client: S3 } = await import("@aws-sdk/client-s3");
    _client = new S3({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      maxAttempts: 2,
      ...(cfg.endpoint
        ? { endpoint: cfg.endpoint, forcePathStyle: cfg.forcePathStyle }
        : {}),
    });
    _bucket = cfg.bucket;
    logger.info(`[S3Helper] Initialized (bucket=${_bucket})`);
    return { client: _client, bucket: _bucket };
  } catch (err) {
    logger.warn(
      "[S3Helper] Failed to init S3 client, uploads will use local storage only:",
      err,
    );
    return null;
  }
}

export function getS3Url(storageKey: string): string {
  const cfg = getS3Config();
  if (!cfg.bucket) return storageKey;
  if (cfg.endpoint) {
    return `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}/${storageKey}`;
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${storageKey}`;
}

export async function uploadToS3(params: {
  filePath: string;
  entityType: string;
  entityId: string;
  category: string;
  fileName: string;
  mimeType: string;
}): Promise<string | null> {
  try {
    const s3 = await getClient();
    if (!s3) return null;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const storageKey = `${params.entityType}/${params.entityId}/${params.category}/${params.fileName}`;
    const fileStream = fs.createReadStream(params.filePath);

    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: storageKey,
        Body: fileStream,
        ContentType: params.mimeType,
      }),
    );

    logger.info(`[S3Helper] Uploaded: ${storageKey}`);
    return storageKey;
  } catch (err) {
    logger.error(`[S3Helper] Upload failed for ${params.filePath}:`, err);
    return null;
  }
}

export async function uploadBufferToS3(params: {
  buffer: Buffer;
  entityType: string;
  entityId: string;
  category: string;
  fileName: string;
  mimeType: string;
}): Promise<string | null> {
  try {
    const s3 = await getClient();
    if (!s3) return null;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const storageKey = `${params.entityType}/${params.entityId}/${params.category}/${params.fileName}`;

    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: storageKey,
        Body: params.buffer,
        ContentType: params.mimeType,
      }),
    );

    logger.info(`[S3Helper] Uploaded buffer: ${storageKey}`);
    return storageKey;
  } catch (err) {
    logger.error(
      `[S3Helper] Buffer upload failed for ${params.fileName}:`,
      err,
    );
    return null;
  }
}

export async function deleteFromS3(storageKey: string): Promise<boolean> {
  try {
    const s3 = await getClient();
    if (!s3) return false;

    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await s3.client.send(
      new DeleteObjectCommand({ Bucket: s3.bucket, Key: storageKey }),
    );
    logger.info(`[S3Helper] Deleted: ${storageKey}`);
    return true;
  } catch (err) {
    logger.error(`[S3Helper] Delete failed for ${storageKey}:`, err);
    return false;
  }
}

export async function getPresignedUrl(
  storageKey: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  try {
    const s3 = await getClient();
    if (!s3) return null;

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const command = new GetObjectCommand({
      Bucket: s3.bucket,
      Key: storageKey,
    });
    return await getSignedUrl(s3.client as any, command, { expiresIn });
  } catch (err) {
    logger.error(`[S3Helper] Presigned URL failed for ${storageKey}:`, err);
    return null;
  }
}
