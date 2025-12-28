import { createImageUpload } from 'novel';
import { toast } from 'sonner';

const onUpload = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // 使用 FileReader 转换为 base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = () => {
      toast.error('图片上传失败');
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes('image/')) {
      toast.error('请上传图片文件');
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error('图片大小不能超过 20MB');
      return false;
    }
    return true;
  },
});

