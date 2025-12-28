// 日期工具函数

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date: string | Date): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 */
export const formatDateTime = (date: string | Date): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化为相对时间（如：3天前）
 */
export const formatRelativeTime = (date: string | Date): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 7) {
        return formatDate(date);
    } else if (diffDays > 0) {
        return `${diffDays}天前`;
    } else if (diffHours > 0) {
        return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes}分钟前`;
    } else {
        return '刚刚';
    }
};

/**
 * 检查日期是否为今天
 */
export const isToday = (date: string | Date): boolean => {
    if (!date) return false;
    
    const d = new Date(date);
    const today = new Date();
    
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

/**
 * 检查日期是否为昨天
 */
export const isYesterday = (date: string | Date): boolean => {
    if (!date) return false;
    
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
};
