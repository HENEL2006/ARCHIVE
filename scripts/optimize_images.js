import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "public/images";
const backupDir = "public/images_backup";

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log("=== Original Image Sizes ===");
const files = fs.readdirSync(dir).filter(f => /\.(jpg|png|jpeg)$/i.test(f));

for (const file of files) {
  const src = path.join(dir, file);
  const backup = path.join(backupDir, file);
  
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(src, backup);
  }

  const meta = await sharp(src).metadata();
  const origSize = fs.statSync(src).size;
  console.log(`${file}: ${meta.width}x${meta.height}, ${(origSize / 1024).toFixed(1)} KB`);

  // Optimize in-place keeping format and aspect ratio, with high visual quality
  if (file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg")) {
    const maxWidth = 1920;
    const shouldResize = meta.width > maxWidth;
    
    let pipeline = sharp(backup);
    if (shouldResize) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }
    const optimizedBuffer = await pipeline
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer();

    fs.writeFileSync(src, optimizedBuffer);
    console.log(`  -> Optimized JPEG: ${(optimizedBuffer.length / 1024).toFixed(1)} KB (-${(((origSize - optimizedBuffer.length) / origSize) * 100).toFixed(1)}%)`);

    // Also produce modern .webp version
    const webpPath = path.join(dir, file.replace(/\.(jpg|jpeg)$/i, ".webp"));
    await sharp(backup)
      .resize(shouldResize ? { width: maxWidth, withoutEnlargement: true } : undefined)
      .webp({ quality: 80, effort: 4 })
      .toFile(webpPath);
  } else if (file.toLowerCase().endsWith(".png")) {
    const maxWidth = 1200;
    const shouldResize = meta.width > maxWidth;

    let pipeline = sharp(backup);
    if (shouldResize) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }
    const optimizedBuffer = await pipeline
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();

    // If optimized is smaller, write it
    if (optimizedBuffer.length < origSize) {
      fs.writeFileSync(src, optimizedBuffer);
      console.log(`  -> Optimized PNG: ${(optimizedBuffer.length / 1024).toFixed(1)} KB (-${(((origSize - optimizedBuffer.length) / origSize) * 100).toFixed(1)}%)`);
    } else {
      console.log(`  -> PNG already optimal`);
    }

    // Also produce modern .webp version
    const webpPath = path.join(dir, file.replace(/\.png$/i, ".webp"));
    await sharp(backup)
      .resize(shouldResize ? { width: maxWidth, withoutEnlargement: true } : undefined)
      .webp({ quality: 85, effort: 4 })
      .toFile(webpPath);
  }
}

console.log("Image optimization complete.");
