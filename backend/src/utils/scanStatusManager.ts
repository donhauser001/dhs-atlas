/**
 * 扫描状态管理器
 * 用于管理文件扫描的进度和状态
 */

export interface ScanProgress {
    id: string;
    status: 'idle' | 'scanning' | 'completed' | 'error';
    startTime?: Date;
    endTime?: Date;
    currentFile?: string;
    currentDirectory?: string;
    scannedCount: number;
    importedCount: number;
    errorCount: number;
    totalFiles?: number;
    message?: string;
    error?: string;
}

class ScanStatusManager {
    private static instance: ScanStatusManager;
    private scanProgress: Map<string, ScanProgress> = new Map();

    private constructor() { }

    static getInstance(): ScanStatusManager {
        if (!ScanStatusManager.instance) {
            ScanStatusManager.instance = new ScanStatusManager();
        }
        return ScanStatusManager.instance;
    }

    /**
     * 创建新的扫描任务
     */
    createScan(userId: string): string {
        const scanId = `scan_${userId}_${Date.now()}`;
        const progress: ScanProgress = {
            id: scanId,
            status: 'idle',
            scannedCount: 0,
            importedCount: 0,
            errorCount: 0
        };

        this.scanProgress.set(scanId, progress);
        return scanId;
    }

    /**
     * 开始扫描
     */
    startScan(scanId: string): void {
        const progress = this.scanProgress.get(scanId);
        if (progress) {
            progress.status = 'scanning';
            progress.startTime = new Date();
            progress.message = '正在初始化扫描...';
        }
    }

    /**
     * 更新扫描进度
     */
    updateProgress(scanId: string, update: Partial<ScanProgress>): void {
        const progress = this.scanProgress.get(scanId);
        if (progress) {
            Object.assign(progress, update);
        }
    }

    /**
     * 完成扫描
     */
    completeScan(scanId: string, finalStats: { scannedCount: number; importedCount: number; errorCount: number }): void {
        const progress = this.scanProgress.get(scanId);
        if (progress) {
            progress.status = 'completed';
            progress.endTime = new Date();
            progress.scannedCount = finalStats.scannedCount;
            progress.importedCount = finalStats.importedCount;
            progress.errorCount = finalStats.errorCount;
            progress.message = `扫描完成！共扫描 ${finalStats.scannedCount} 个文件，导入 ${finalStats.importedCount} 个文件`;
        }
    }

    /**
     * 标记扫描错误
     */
    errorScan(scanId: string, error: string): void {
        const progress = this.scanProgress.get(scanId);
        if (progress) {
            progress.status = 'error';
            progress.endTime = new Date();
            progress.error = error;
            progress.message = `扫描失败: ${error}`;
        }
    }

    /**
     * 获取扫描进度
     */
    getProgress(scanId: string): ScanProgress | null {
        return this.scanProgress.get(scanId) || null;
    }

    /**
     * 获取用户的活动扫描
     */
    getUserActiveScan(userId: string): ScanProgress | null {
        for (const [scanId, progress] of this.scanProgress.entries()) {
            if (scanId.includes(`scan_${userId}_`) &&
                (progress.status === 'scanning' || progress.status === 'idle')) {
                return progress;
            }
        }
        return null;
    }

    /**
     * 获取用户的最近扫描
     */
    getUserRecentScan(userId: string): ScanProgress | null {
        let recentScan: ScanProgress | null = null;
        let latestTime = 0;

        for (const [scanId, progress] of this.scanProgress.entries()) {
            if (scanId.includes(`scan_${userId}_`)) {
                const time = progress.startTime?.getTime() || 0;
                if (time > latestTime) {
                    latestTime = time;
                    recentScan = progress;
                }
            }
        }
        return recentScan;
    }

    /**
     * 清理完成的扫描记录
     */
    cleanup(): void {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        for (const [scanId, progress] of this.scanProgress.entries()) {
            if (progress.status === 'completed' || progress.status === 'error') {
                if (progress.endTime && progress.endTime < oneHourAgo) {
                    this.scanProgress.delete(scanId);
                }
            }
        }
    }

    /**
     * 删除扫描记录
     */
    deleteScan(scanId: string): void {
        this.scanProgress.delete(scanId);
    }
}

export default ScanStatusManager;
