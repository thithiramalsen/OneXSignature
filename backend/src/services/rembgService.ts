import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

/**
 * Process signature image with rembg to remove background
 * @param inputPath - Path to the input image
 * @returns Path to the processed image
 */
export const processSignatureWithRembg = async (inputPath: string): Promise<string> => {
  const outputPath = path.join(
    'uploads/temp',
    `processed_${Date.now()}_${path.basename(inputPath)}`
  );

  try {
    // Use rembg CLI to remove background
    await execPromise(`rembg i "${inputPath}" "${outputPath}"`);

    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Rembg processing failed - output file not created');
    }

    return outputPath;
  } catch (error) {
    console.error('Rembg processing error:', error);
    
    // Fallback: If rembg fails, just copy the original file
    // This ensures the system works even if rembg is not available
    console.warn('Rembg not available, using original image');
    const fallbackPath = path.join(
      'uploads/temp',
      `fallback_${Date.now()}_${path.basename(inputPath)}`
    );
    fs.copyFileSync(inputPath, fallbackPath);
    return fallbackPath;
  }
};
