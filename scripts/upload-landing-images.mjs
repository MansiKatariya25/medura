import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "scripts", "landing-images.json");
const OUTPUT_PATH = path.join(ROOT, "scripts", "landing-images-map.json");

const parseEnvFile = (content) => {
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
};

const loadEnv = async () => {
  const envPath = path.join(ROOT, ".env");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    return parseEnvFile(raw);
  } catch {
    return {};
  }
};

const fetchImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
};

const inferExtension = (contentType) => {
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "bin";
};

const uploadToCloudinary = async (file, contentType, cloudName, uploadPreset, publicId) => {
  const form = new FormData();
  const ext = inferExtension(contentType);
  const fileName = `${publicId}.${ext}`;
  form.append("file", new Blob([file], { type: contentType }), fileName);
  form.append("upload_preset", uploadPreset);
  form.append("folder", "medura/landing");
  form.append("public_id", publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const msg = payload?.error?.message || "Cloudinary upload failed";
    throw new Error(msg);
  }
  return payload.secure_url || payload.url;
};

const collectFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
};

const main = async () => {
  const env = await loadEnv();
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary env vars (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).");
  }

  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const urls = Array.from(new Set(parsed.urls || []));

  if (urls.length === 0) {
    throw new Error("No image URLs found in scripts/landing-images.json.");
  }

  const mapping = {};
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const { buffer, contentType } = await fetchImage(url);
    const publicId = `landing-${String(i + 1).padStart(2, "0")}`;
    const secureUrl = await uploadToCloudinary(
      buffer,
      contentType,
      cloudName,
      uploadPreset,
      publicId
    );
    mapping[url] = secureUrl;
    console.log(`Uploaded ${url} -> ${secureUrl}`);
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(mapping, null, 2), "utf8");

  const landingDirs = [
    path.join(ROOT, "components", "landing"),
    path.join(ROOT, "app", "landing"),
  ];
  const files = [];
  for (const dir of landingDirs) {
    try {
      files.push(...(await collectFiles(dir)));
    } catch {
      // ignore missing dirs
    }
  }

  for (const filePath of files) {
    const original = await fs.readFile(filePath, "utf8");
    let next = original;
    for (const [from, to] of Object.entries(mapping)) {
      next = next.split(from).join(to);
    }
    if (next !== original) {
      await fs.writeFile(filePath, next, "utf8");
      console.log(`Updated ${path.relative(ROOT, filePath)}`);
    }
  }

  console.log(`Saved mapping to ${path.relative(ROOT, OUTPUT_PATH)}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
