/**
 * Image Optimization Middleware
 * تحسين الصور تلقائياً
 */

import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Image Optimization Configuration
 */
interface ImageOptimizationConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  cache?: boolean;
}

const defaultConfig: ImageOptimizationConfig = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp',
  cache: true,
};

/**
 * Optimize Image Middleware
 * Automatically optimizes images on the fly
 */
export function optimizeImageMiddleware(config: ImageOptimizationConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only process image requests
    if (!req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return next();
    }

    try {
      const imagePath = path.join(process.cwd(), 'client', 'public', req.path);

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        return next();
      }

      // Read image
      const imageBuffer = fs.readFileSync(imagePath);

      // Create sharp instance
      let image = sharp(imageBuffer);

      // Get image metadata
      const metadata = await image.metadata();

      // Resize if needed
      if (
        (finalConfig.maxWidth && metadata.width && metadata.width > finalConfig.maxWidth) ||
        (finalConfig.maxHeight && metadata.height && metadata.height > finalConfig.maxHeight)
      ) {
        image = image.resize(finalConfig.maxWidth, finalConfig.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert format
      if (finalConfig.format === 'webp') {
        image = image.webp({ quality: finalConfig.quality });
        res.setHeader('Content-Type', 'image/webp');
      } else if (finalConfig.format === 'jpeg') {
        image = image.jpeg({ quality: finalConfig.quality });
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (finalConfig.format === 'png') {
        image = image.png({ quality: finalConfig.quality });
        res.setHeader('Content-Type', 'image/png');
      }

      // Set cache headers
      if (finalConfig.cache) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      }

      // Send optimized image
      const optimizedBuffer = await image.toBuffer();
      res.send(optimizedBuffer);
    } catch (error) {
      console.error('Image optimization error:', error);
      next();
    }
  };
}

/**
 * Lazy Load Image Helper
 * Generates blur placeholder for lazy loading
 */
export async function generateBlurPlaceholder(imagePath: string): Promise<string> {
  try {
    const buffer = await sharp(imagePath)
      .resize(10, 10, { fit: 'inside' })
      .blur()
      .toBuffer();

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Blur placeholder generation error:', error);
    return '';
  }
}

/**
 * WebP Conversion Utility
 * Converts images to WebP format
 */
export async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<void> {
  try {
    await sharp(inputPath).webp({ quality }).toFile(outputPath);
  } catch (error) {
    console.error('WebP conversion error:', error);
    throw error;
  }
}

/**
 * Batch Image Optimization
 * Optimizes multiple images in a directory
 */
export async function batchOptimizeImages(
  directory: string,
  config: ImageOptimizationConfig = {}
): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };

  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
        const inputPath = path.join(directory, file);
        const outputPath = path.join(
          directory,
          `${path.parse(file).name}.${finalConfig.format}`
        );

        await convertToWebP(inputPath, outputPath, finalConfig.quality);
      }
    }
  } catch (error) {
    console.error('Batch optimization error:', error);
    throw error;
  }
}

export default {
  optimizeImageMiddleware,
  generateBlurPlaceholder,
  convertToWebP,
  batchOptimizeImages,
};
