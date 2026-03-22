import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const execFilePromise = promisify(execFile);

const extractInkToTransparent = async (sourcePath: string, targetPath: string): Promise<void> => {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels < 4) {
    throw new Error('Expected RGBA image data while extracting signature ink');
  }

  // Estimate paper/background brightness from border pixels.
  let borderLumTotal = 0;
  let borderCount = 0;
  const addLum = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    borderLumTotal += lum;
    borderCount += 1;
  };

  for (let x = 0; x < info.width; x += 1) {
    addLum(x * channels);
    addLum(((info.height - 1) * info.width + x) * channels);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    addLum((y * info.width) * channels);
    addLum((y * info.width + (info.width - 1)) * channels);
  }

  const bgLum = borderCount > 0 ? borderLumTotal / borderCount : 235;
  const keepLow = 10;  // near background -> fully transparent
  const keepHigh = 55; // sufficiently darker than background -> fully opaque

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const delta = bgLum - lum;

    let alpha = 0;
    if (delta <= keepLow) {
      alpha = 0;
    } else if (delta >= keepHigh) {
      alpha = 255;
    } else {
      alpha = Math.round(((delta - keepLow) / (keepHigh - keepLow)) * 255);
    }

    // Keep dark ink black for crisp rendering on PDFs.
    const darkBoost = Math.max(0, Math.min(255, Math.round(255 - (delta * 3))));
    data[i] = Math.min(data[i], darkBoost);
    data[i + 1] = Math.min(data[i + 1], darkBoost);
    data[i + 2] = Math.min(data[i + 2], darkBoost);
    data[i + 3] = alpha;
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels,
    },
  })
    .png()
    .toFile(targetPath);
};

export type SignatureProcessingMode = 'auto' | 'ink-only';

/**
 * Process signature image using selected mode.
 * auto: rembg + ink cleanup
 * ink-only: strong paper-photo ink extraction
 */
export const processSignatureWithRembg = async (
  inputPath: string,
  mode: SignatureProcessingMode = 'auto'
): Promise<string> => {
  const outputPath = path.join(
    'uploads/temp',
    `processed_${Date.now()}_${path.parse(inputPath).name}.png`
  );
  const cleanedPath = path.join(
    'uploads/temp',
    `cleaned_${Date.now()}_${path.parse(inputPath).name}.png`
  );

  if (mode === 'ink-only') {
    const inkOnlyPath = path.join(
      'uploads/temp',
      `inkonly_${Date.now()}_${path.parse(inputPath).name}.png`
    );
    await extractInkToTransparent(inputPath, inkOnlyPath);
    return inkOnlyPath;
  }

  try {
    // Use rembg Python API directly (more stable than CLI in containers)
    const script = [
      'from rembg import remove',
      'import sys',
      'input_path = sys.argv[1]',
      'output_path = sys.argv[2]',
      'with open(input_path, "rb") as src:',
      '    data = src.read()',
      'result = remove(data)',
      'with open(output_path, "wb") as dst:',
      '    dst.write(result)',
    ].join('; ');

    await execFilePromise('python3', ['-c', script, inputPath, outputPath]);

    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Rembg processing failed - output file not created');
    }

    await extractInkToTransparent(outputPath, cleanedPath);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return cleanedPath;
  } catch (error) {
    console.error('Rembg processing error:', error);

    // Fallback: signature-ink extraction for dark-ink-on-paper images.
    // This works even if rembg model download/runtime fails.
    const fallbackPath = path.join(
      'uploads/temp',
      `fallback_${Date.now()}_${path.parse(inputPath).name}.png`
    );

    await extractInkToTransparent(inputPath, fallbackPath);

    return fallbackPath;
  }
};
