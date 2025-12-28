import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

// 缩略图配置
const THUMBNAIL_CONFIG = {
  width: 200,
  height: 200,
  quality: 80,
  suffix: '_thumb',
};

export class ThumbnailService {
  /**
   * 检查是否为图片文件
   */
  static isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * 获取缩略图路径
   */
  static getThumbnailPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    return path.join(dir, `${basename}${THUMBNAIL_CONFIG.suffix}${ext}`);
  }

  /**
   * 获取缩略图 URL
   */
  static getThumbnailUrl(originalUrl: string): string {
    const ext = path.extname(originalUrl);
    const basename = path.basename(originalUrl, ext);
    const dir = path.dirname(originalUrl);
    return `${dir}/${basename}${THUMBNAIL_CONFIG.suffix}${ext}`;
  }

  /**
   * 生成缩略图
   */
  static async generateThumbnail(originalPath: string): Promise<string | null> {
    try {
      // 检查是否为图片文件
      if (!this.isImageFile(originalPath)) {
        return null;
      }

      // 检查原文件是否存在
      if (!fs.existsSync(originalPath)) {
        console.error(`原文件不存在: ${originalPath}`);
        return null;
      }

      const thumbnailPath = this.getThumbnailPath(originalPath);
      const ext = path.extname(originalPath).toLowerCase();

      // 根据文件类型配置 sharp
      let sharpInstance = sharp(originalPath);

      // GIF 需要特殊处理（只取第一帧）
      if (ext === '.gif') {
        sharpInstance = sharpInstance.gif({ pages: 1 });
      }

      // 生成缩略图
      await sharpInstance
        .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: THUMBNAIL_CONFIG.quality })
        .toFile(thumbnailPath.replace(ext, '.jpg'));

      // 如果原始格式不是 jpg，返回 jpg 缩略图路径
      const finalThumbnailPath = ext !== '.jpg' && ext !== '.jpeg'
        ? thumbnailPath.replace(ext, '.jpg')
        : thumbnailPath;

      console.log(`✅ 缩略图生成成功: ${finalThumbnailPath}`);
      return finalThumbnailPath;
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return null;
    }
  }

  /**
   * 批量生成缩略图
   */
  static async generateThumbnails(filePaths: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    for (const filePath of filePaths) {
      const thumbnailPath = await this.generateThumbnail(filePath);
      results.set(filePath, thumbnailPath);
    }

    return results;
  }

  /**
   * 删除缩略图
   */
  static deleteThumbnail(originalPath: string): void {
    try {
      const thumbnailPath = this.getThumbnailPath(originalPath);
      const ext = path.extname(originalPath).toLowerCase();

      // 尝试删除原格式缩略图
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      // 如果不是 jpg，还要尝试删除 jpg 格式的缩略图
      if (ext !== '.jpg' && ext !== '.jpeg') {
        const jpgThumbnailPath = thumbnailPath.replace(ext, '.jpg');
        if (fs.existsSync(jpgThumbnailPath)) {
          fs.unlinkSync(jpgThumbnailPath);
        }
      }
    } catch (error) {
      console.error('删除缩略图失败:', error);
    }
  }

  /**
   * 检查缩略图是否存在
   */
  static thumbnailExists(originalPath: string): boolean {
    const thumbnailPath = this.getThumbnailPath(originalPath);
    const ext = path.extname(originalPath).toLowerCase();

    if (fs.existsSync(thumbnailPath)) {
      return true;
    }

    // 检查 jpg 格式的缩略图
    if (ext !== '.jpg' && ext !== '.jpeg') {
      const jpgThumbnailPath = thumbnailPath.replace(ext, '.jpg');
      return fs.existsSync(jpgThumbnailPath);
    }

    return false;
  }
}

export default ThumbnailService;


