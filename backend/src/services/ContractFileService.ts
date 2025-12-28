import GeneratedContract from '../models/GeneratedContract';
import * as fs from 'fs';
import * as path from 'path';

export class ContractFileService {
    /**
     * 上传签署文件
     */
    static async uploadSignedFile(contractId: string, filePath: string) {
        const contract = await GeneratedContract.findById(contractId);
        if (!contract) {
            throw new Error('合同不存在');
        }

        // 更新合同，设置签署文件路径、签署时间和状态
        const updateData: any = {
            signedFile: filePath,
            signedTime: new Date(),
            status: 'signed',
            updateTime: new Date()
        };

        const updatedContract = await GeneratedContract.findByIdAndUpdate(
            contractId,
            updateData,
            { new: true }
        ).populate('templateId', 'name category');

        return updatedContract;
    }

    /**
     * 下载签署文件
     */
    static async getSignedFileStream(contractId: string) {
        const contract = await GeneratedContract.findById(contractId);
        if (!contract) {
            throw new Error('合同不存在');
        }

        if (!contract.signedFile) {
            throw new Error('该合同没有签署文件');
        }

        // 检查文件是否存在
        if (!fs.existsSync(contract.signedFile)) {
            throw new Error('签署文件不存在');
        }

        return {
            contract,
            filePath: contract.signedFile,
            fileName: path.basename(contract.signedFile),
            fileStream: fs.createReadStream(contract.signedFile)
        };
    }

    /**
     * 删除签署文件
     */
    static async deleteSignedFile(contractId: string) {
        const contract = await GeneratedContract.findById(contractId);
        if (!contract) {
            throw new Error('合同不存在');
        }

        if (!contract.signedFile) {
            throw new Error('该合同没有签署文件');
        }

        // 删除文件系统中的文件
        if (fs.existsSync(contract.signedFile)) {
            fs.unlinkSync(contract.signedFile);
        }

        // 更新合同记录，清除签署文件信息，但保持签署状态
        const updatedContract = await GeneratedContract.findByIdAndUpdate(
            contractId,
            {
                $unset: { signedFile: 1 },
                updateTime: new Date()
            },
            { new: true }
        ).populate('templateId', 'name category');

        return updatedContract;
    }

    /**
     * 检查文件是否存在
     */
    static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * 创建文件目录
     */
    static ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * 获取文件信息
     */
    static getFileInfo(filePath: string) {
        if (!fs.existsSync(filePath)) {
            throw new Error('文件不存在');
        }

        const stats = fs.statSync(filePath);
        return {
            size: stats.size,
            birthtime: stats.birthtime,
            mtime: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    }

    /**
     * 移动或重命名文件
     */
    static moveFile(oldPath: string, newPath: string): void {
        if (!fs.existsSync(oldPath)) {
            throw new Error('源文件不存在');
        }

        // 确保目标目录存在
        const targetDir = path.dirname(newPath);
        this.ensureDirectoryExists(targetDir);

        fs.renameSync(oldPath, newPath);
    }

    /**
     * 复制文件
     */
    static copyFile(sourcePath: string, targetPath: string): void {
        if (!fs.existsSync(sourcePath)) {
            throw new Error('源文件不存在');
        }

        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        this.ensureDirectoryExists(targetDir);

        fs.copyFileSync(sourcePath, targetPath);
    }
}
