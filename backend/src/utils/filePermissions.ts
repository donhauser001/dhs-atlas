import { IFile } from '../models/File';

/**
 * 用户角色枚举
 */
export enum UserRole {
    SUPER_ADMIN = '超级管理员',
    PROJECT_MANAGER = '项目经理',
    DESIGNER = '设计师',
    CLIENT = '客户',
    EMPLOYEE = '员工'
}

/**
 * 用户信息接口
 */
export interface UserInfo {
    userId: string;
    username: string;
    role: string;
    permissions?: string[];
}

/**
 * 文件权限检查工具类
 */
export class FilePermissionChecker {
    /**
     * 检查用户是否为管理员
     * @param user 用户信息
     * @returns 是否为管理员
     */
    static isAdmin(user: UserInfo): boolean {
        return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PROJECT_MANAGER;
    }

    /**
     * 检查用户是否可以查看文件
     * @param user 用户信息
     * @param file 文件信息
     * @returns 是否有查看权限
     */
    static canViewFile(user: UserInfo, file: IFile): boolean {
        // 管理员可以查看所有文件
        if (this.isAdmin(user)) {
            return true;
        }

        // 文件所有者可以查看自己的文件
        if (file.uploadedBy.toString() === user.userId) {
            return true;
        }

        // 公开文件所有人都可以查看
        if (file.isPublic) {
            return true;
        }

        // 其他情况不允许查看
        return false;
    }

    /**
     * 检查用户是否可以编辑文件
     * @param user 用户信息
     * @param file 文件信息
     * @returns 是否有编辑权限
     */
    static canEditFile(user: UserInfo, file: IFile): boolean {
        // 管理员可以编辑所有文件
        if (this.isAdmin(user)) {
            return true;
        }

        // 文件所有者可以编辑自己的文件
        if (file.uploadedBy.toString() === user.userId) {
            return true;
        }

        // 其他情况不允许编辑
        return false;
    }

    /**
     * 检查用户是否可以删除文件
     * @param user 用户信息
     * @param file 文件信息
     * @returns 是否有删除权限
     */
    static canDeleteFile(user: UserInfo, file: IFile): boolean {
        // 管理员可以删除所有文件
        if (this.isAdmin(user)) {
            return true;
        }

        // 文件所有者可以删除自己的文件
        if (file.uploadedBy.toString() === user.userId) {
            return true;
        }

        // 其他情况不允许删除
        return false;
    }

    /**
     * 检查用户是否可以下载文件
     * @param user 用户信息
     * @param file 文件信息
     * @returns 是否有下载权限
     */
    static canDownloadFile(user: UserInfo, file: IFile): boolean {
        // 下载权限与查看权限相同
        return this.canViewFile(user, file);
    }

    /**
     * 检查用户是否可以分享文件
     * @param user 用户信息
     * @param file 文件信息
     * @returns 是否有分享权限
     */
    static canShareFile(user: UserInfo, file: IFile): boolean {
        // 管理员可以分享所有文件
        if (this.isAdmin(user)) {
            return true;
        }

        // 文件所有者可以分享自己的文件
        if (file.uploadedBy.toString() === user.userId) {
            return true;
        }

        // 其他情况不允许分享
        return false;
    }

    /**
     * 获取用户可以查看的文件查询条件
     * @param user 用户信息
     * @param category 文件分类（可选）
     * @returns 查询条件
     */
    static getFileQueryConditions(user: UserInfo, category?: string): any {
        const baseQuery: any = {
            status: 'active'
        };

        // 如果指定了分类，添加分类条件
        if (category && category !== 'all') {
            baseQuery.category = category;
        }

        // 管理员可以查看所有文件
        if (this.isAdmin(user)) {
            return baseQuery;
        }

        // 普通用户只能查看自己的文件或公开文件
        // 对于项目文件，允许查看所有项目文件（因为项目成员应该能看到项目文件）
        if (category === 'projects') {
            // 项目文件对所有用户可见（项目成员权限由项目本身控制）
            return baseQuery;
        }

        // 对于客户文件，允许查看所有客户文件（客户文件应该对关联用户可见）
        if (category === 'clients') {
            // 客户文件对所有用户可见（客户文件权限由客户关联关系控制）
            return baseQuery;
        }

        baseQuery.$or = [
            { uploadedBy: user.userId }, // 自己上传的文件
            { isPublic: true } // 公开文件
        ];

        return baseQuery;
    }

    /**
     * 获取用户文件的查询条件（仅用户自己的文件）
     * @param user 用户信息
     * @param targetUserId 目标用户ID（可选，管理员可以查看其他用户的文件）
     * @returns 查询条件
     */
    static getUserFileQueryConditions(user: UserInfo, targetUserId?: string): any {
        const baseQuery: any = {
            status: 'active',
            category: 'users'
        };

        // 如果是管理员且指定了目标用户ID
        if (this.isAdmin(user) && targetUserId) {
            baseQuery.uploadedBy = targetUserId;
            return baseQuery;
        }

        // 如果是管理员但没有指定目标用户，返回所有用户文件
        if (this.isAdmin(user) && !targetUserId) {
            return baseQuery;
        }

        // 普通用户只能查看自己的文件
        baseQuery.uploadedBy = user.userId;
        return baseQuery;
    }

    /**
     * 过滤用户有权限查看的文件列表
     * @param user 用户信息
     * @param files 文件列表
     * @returns 过滤后的文件列表
     */
    static filterViewableFiles(user: UserInfo, files: IFile[]): IFile[] {
        return files.filter(file => this.canViewFile(user, file));
    }

    /**
     * 检查用户是否有特定权限
     * @param user 用户信息
     * @param permission 权限名称
     * @returns 是否有该权限
     */
    static hasPermission(user: UserInfo, permission: string): boolean {
        // 管理员拥有所有权限
        if (this.isAdmin(user)) {
            return true;
        }

        // 检查用户是否有特定权限
        return user.permissions?.includes(permission) || false;
    }

    /**
     * 获取用户的文件操作权限摘要
     * @param user 用户信息
     * @param file 文件信息
     * @returns 权限摘要
     */
    static getFilePermissionSummary(user: UserInfo, file: IFile) {
        return {
            canView: this.canViewFile(user, file),
            canEdit: this.canEditFile(user, file),
            canDelete: this.canDeleteFile(user, file),
            canDownload: this.canDownloadFile(user, file),
            canShare: this.canShareFile(user, file),
            isOwner: file.uploadedBy.toString() === user.userId,
            isAdmin: this.isAdmin(user)
        };
    }
}

/**
 * 权限检查装饰器工厂
 * @param permissionCheck 权限检查函数
 * @returns 装饰器函数
 */
export function requireFilePermission(
    permissionCheck: (user: UserInfo, file: IFile) => boolean
) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const [req, res] = args;
            const user = req.user;
            const file = req.file || req.body.file;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '用户未认证'
                });
            }

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '文件信息缺失'
                });
            }

            if (!permissionCheck(user, file)) {
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                });
            }

            return method.apply(this, args);
        };
    };
}