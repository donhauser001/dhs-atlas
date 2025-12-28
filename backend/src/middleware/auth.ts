import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { IEmployeeProfile, IClientContactProfile, UserType } from '../models/User';

// ═══════════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════════

/** 员工状态枚举 */
export type EmployeeStatus = 'active' | 'left' | 'suspended' | 'pending';

/** 统一错误码枚举 */
export enum AuthErrorCode {
    // 401 类错误
    UNAUTHORIZED = 'UNAUTHORIZED',
    TOKEN_MISSING = 'TOKEN_MISSING',
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',

    // 403 类错误 - 客户门户
    NO_PORTAL_ROLE = 'NO_PORTAL_ROLE',
    NOT_CLIENT_CONTACT = 'NOT_CLIENT_CONTACT',
    NO_CLIENT_ID = 'NO_CLIENT_ID',
    INCOMPLETE_PROFILE = 'INCOMPLETE_PROFILE',

    // 403 类错误 - 员工
    NOT_EMPLOYEE = 'NOT_EMPLOYEE',
    EMPLOYEE_LEFT = 'EMPLOYEE_LEFT',
    EMPLOYEE_SUSPENDED = 'EMPLOYEE_SUSPENDED',
    EMPLOYEE_PENDING = 'EMPLOYEE_PENDING',

    // 403 类错误 - 角色
    ROLE_REQUIRED = 'ROLE_REQUIRED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/** 安全日志级别 */
export type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/** 安全日志条目 */
interface SecurityLogEntry {
    level: SecurityLogLevel;
    code: AuthErrorCode;
    userId?: string;
    email?: string;
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    message: string;
    timestamp: Date;
    meta?: Record<string, any>;
}

// 扩展 Request 接口，添加 user 属性
declare global {
    namespace Express {
        interface Request {
            user?: {
                // 基础信息
                id: string;
                userId: string;
                username: string;
                realName: string;
                email?: string;
                phone?: string;

                // 新增字段
                userTypes?: UserType[];
                roles?: string[];
                employeeProfile?: IEmployeeProfile;
                clientContactProfile?: IClientContactProfile;

                // 便捷访问字段（中间件填充）
                currentClientId?: string;
                currentEnterpriseId?: string;

                // 旧字段（兼容）
                role: string;
                department?: string;
                enterpriseId?: string;
                enterpriseName?: string;
                departmentId?: string;
                departmentName?: string;
                position?: string;
                permissions?: string[];
                permissionGroups?: string[];
            };
        }
    }
}

const userService = new UserService();

// ═══════════════════════════════════════════════════════════════════════════
// 安全日志工具
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 安全日志记录器
 * 用于记录所有权限相关的安全事件
 *
 * TODO: 后期可以接入 MongoDB 或专用日志服务
 */
class SecurityLogger {
    private static instance: SecurityLogger;

    private constructor() {}

    static getInstance(): SecurityLogger {
        if (!SecurityLogger.instance) {
            SecurityLogger.instance = new SecurityLogger();
        }
        return SecurityLogger.instance;
    }

    /**
     * 记录安全日志
     */
    log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
        const fullEntry: SecurityLogEntry = {
            ...entry,
            timestamp: new Date(),
        };

        // 根据级别输出不同颜色
        const levelColors: Record<SecurityLogLevel, string> = {
            INFO: '\x1b[36m',    // 青色
            WARN: '\x1b[33m',    // 黄色
            ERROR: '\x1b[31m',   // 红色
            CRITICAL: '\x1b[35m' // 紫色
        };
        const reset = '\x1b[0m';
        const color = levelColors[entry.level];

        console.log(
            `${color}[SECURITY ${entry.level}]${reset}`,
            `[${fullEntry.timestamp.toISOString()}]`,
            `${entry.method} ${entry.path}`,
            `| code: ${entry.code}`,
            `| user: ${entry.userId || 'anonymous'}`,
            `| ip: ${entry.ip}`,
            `| ${entry.message}`
        );

        // TODO: 持久化到数据库
        // await SecurityLog.create(fullEntry);
    }

    /**
     * 记录权限拒绝事件
     */
    logDenied(req: Request, code: AuthErrorCode, message: string, meta?: Record<string, any>): void {
        this.log({
            level: this.getLogLevel(code),
            code,
            userId: req.user?.id,
            email: req.user?.email,
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            path: req.path,
            method: req.method,
            message,
            meta,
        });
    }

    /**
     * 根据错误码确定日志级别
     */
    private getLogLevel(code: AuthErrorCode): SecurityLogLevel {
        const criticalCodes = [AuthErrorCode.EMPLOYEE_LEFT, AuthErrorCode.ACCOUNT_DISABLED];
        const warnCodes = [AuthErrorCode.NO_PORTAL_ROLE, AuthErrorCode.NOT_EMPLOYEE, AuthErrorCode.EMPLOYEE_SUSPENDED];

        if (criticalCodes.includes(code)) return 'CRITICAL';
        if (warnCodes.includes(code)) return 'WARN';
        return 'INFO';
    }
}

const securityLogger = SecurityLogger.getInstance();

// ═══════════════════════════════════════════════════════════════════════════
// 统一错误响应工具
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 统一的权限错误响应格式
 */
interface AuthErrorResponse {
    success: false;
    error: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    reason: AuthErrorCode;
    message: string;
}

/**
 * 发送统一格式的权限错误响应
 */
function sendAuthError(
    res: Response,
    status: 401 | 403 | 500,
    code: AuthErrorCode,
    message: string,
    req?: Request
): Response {
    // 记录安全日志
    if (req) {
        securityLogger.logDenied(req, code, message);
    }

    const errorType = status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR';

    const response: AuthErrorResponse = {
        success: false,
        error: errorType,
        reason: code,
        message,
    };

    return res.status(status).json(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// 核心认证中间件
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return sendAuthError(res, 401, AuthErrorCode.TOKEN_MISSING, '访问被拒绝，未提供认证token', req);
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

        // 获取用户详细信息
        const user = await userService.getUserById(decoded.userId);
        if (!user) {
            return sendAuthError(res, 401, AuthErrorCode.USER_NOT_FOUND, '无效的token，用户不存在', req);
        }

        // 检查用户状态
        if (user.status !== 'active') {
            return sendAuthError(res, 401, AuthErrorCode.ACCOUNT_DISABLED, '账户已被禁用，请联系管理员', req);
        }

        // 将用户信息添加到请求对象中
        req.user = {
            // 基础信息
            id: user._id.toString(),
            userId: user._id.toString(),
            username: user.username,
            realName: user.realName,
            email: user.email,
            phone: user.phone,

            // 新字段
            userTypes: user.userTypes || [],
            roles: user.roles || [],
            employeeProfile: user.employeeProfile,
            clientContactProfile: user.clientContactProfile,

            // 便捷访问字段
            currentClientId: user.clientContactProfile?.clientId?.toString(),
            currentEnterpriseId: user.employeeProfile?.enterpriseId?.toString() || user.enterpriseId,

            // 旧字段（兼容）
            role: user.role,
            department: user.department,
            enterpriseId: user.enterpriseId,
            enterpriseName: user.enterpriseName,
            departmentId: user.departmentId,
            departmentName: user.departmentName,
            position: user.position,
            permissions: user.permissions,
            permissionGroups: user.permissionGroups
        };

        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return sendAuthError(res, 401, AuthErrorCode.TOKEN_INVALID, '无效的token', req);
        }

        if (error instanceof jwt.TokenExpiredError) {
            return sendAuthError(res, 401, AuthErrorCode.TOKEN_EXPIRED, 'token已过期，请重新登录', req);
        }

        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            reason: 'SERVER_ERROR',
            message: '服务器内部错误'
        });
    }
};

/**
 * 可选的认证中间件
 * 如果提供了token则验证，没有提供则继续
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        const user = await userService.getUserById(decoded.userId);

        if (user && user.status === 'active') {
            req.user = {
                id: user._id.toString(),
                userId: user._id.toString(),
                username: user.username,
                realName: user.realName,
                email: user.email,
                phone: user.phone,
                userTypes: user.userTypes || [],
                roles: user.roles || [],
                employeeProfile: user.employeeProfile,
                clientContactProfile: user.clientContactProfile,
                currentClientId: user.clientContactProfile?.clientId?.toString(),
                currentEnterpriseId: user.employeeProfile?.enterpriseId?.toString() || user.enterpriseId,
                role: user.role,
                department: user.department,
                enterpriseId: user.enterpriseId,
                enterpriseName: user.enterpriseName,
                departmentId: user.departmentId,
                departmentName: user.departmentName,
                position: user.position,
                permissions: user.permissions,
                permissionGroups: user.permissionGroups
            };
        }

        next();
    } catch {
        next();
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 环境级中间件（内部 vs 门户）
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 客户门户权限中间件（严格版）
 *
 * 六重校验条件（必须全部满足）：
 * 1. 用户已登录（req.user 存在）
 * 2. roles 包含 'client_portal'
 * 3. userTypes 包含 'client_contact'
 * 4. clientContactProfile.clientId 存在
 * 5. clientContactProfile 非空对象
 * 6. 账户状态为 active（在 authenticateToken 中已校验）
 */
export const requireClientPortal = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // 1️⃣ 校验：用户已登录
    if (!user) {
        return sendAuthError(res, 401, AuthErrorCode.UNAUTHORIZED, '未授权访问，请先登录', req);
    }

    // 2️⃣ 校验：拥有门户角色
    const hasPortalRole = user.roles?.includes('client_portal') || user.role === '客户';
    if (!hasPortalRole) {
        return sendAuthError(res, 403, AuthErrorCode.NO_PORTAL_ROLE, '您没有客户门户访问权限，请联系您的设计顾问开通', req);
    }

    // 3️⃣ 校验：是客户联系人身份
    const isClientContact = user.userTypes?.includes('client_contact') || user.role === '客户';
    if (!isClientContact) {
        return sendAuthError(res, 403, AuthErrorCode.NOT_CLIENT_CONTACT, '您的账户类型不是客户联系人，无法访问客户门户', req);
    }

    // 4️⃣ 校验：关联了有效的客户公司
    const clientId = user.clientContactProfile?.clientId || user.currentClientId;
    if (!clientId) {
        return sendAuthError(res, 403, AuthErrorCode.NO_CLIENT_ID, '您的账户未关联客户公司，请联系管理员完善信息', req);
    }

    // 5️⃣ 校验：profile 完整性
    const profile = user.clientContactProfile;
    if (!profile || Object.keys(profile).length === 0) {
        return sendAuthError(res, 403, AuthErrorCode.INCOMPLETE_PROFILE, '客户联系人资料不完整，请联系管理员', req);
    }

    next();
};

/**
 * 内部用户权限中间件
 * 要求：userTypes 包含 'employee'，且不是门户专用账户
 *
 * 适用于：所有 /api/* 内部管理接口
 */
export const requireInternalUser = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return sendAuthError(res, 401, AuthErrorCode.UNAUTHORIZED, '未授权访问', req);
    }

    const isEmployee = user.userTypes?.includes('employee') ||
        ['超级管理员', '项目经理', '设计师', '员工'].includes(user.role);

    if (!isEmployee) {
        return sendAuthError(res, 403, AuthErrorCode.NOT_EMPLOYEE, '此功能仅限内部员工使用', req);
    }

    // 检查员工状态（完整状态机）
    const status = user.employeeProfile?.status as EmployeeStatus | undefined;

    if (status === 'pending') {
        return sendAuthError(res, 403, AuthErrorCode.EMPLOYEE_PENDING, '您的员工账户尚未激活，请联系管理员', req);
    }

    if (status === 'left') {
        return sendAuthError(res, 403, AuthErrorCode.EMPLOYEE_LEFT, '您的员工账户已离职，无法访问此功能', req);
    }

    if (status === 'suspended') {
        return sendAuthError(res, 403, AuthErrorCode.EMPLOYEE_SUSPENDED, '您的员工账户已被暂停，请联系管理员', req);
    }

    next();
};

/**
 * 门户用户中间件（别名）
 * 方便所有 /api/client-portal/* 路由统一使用
 */
export const requirePortalUser = requireClientPortal;

// ═══════════════════════════════════════════════════════════════════════════
// 角色级中间件
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 角色检查中间件工厂
 * 创建一个中间件，检查用户是否具有指定角色之一
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return sendAuthError(res, 401, AuthErrorCode.UNAUTHORIZED, '未授权访问', req);
        }

        // 检查新 roles 数组
        const hasNewRole = user.roles?.some(role => allowedRoles.includes(role));

        // 检查旧 role 字段（兼容）
        const legacyRoleMapping: Record<string, string[]> = {
            '超级管理员': ['owner', 'admin'],
            '项目经理': ['pm'],
            '设计师': ['designer'],
            '员工': ['designer'],
            '客户': ['client_portal']
        };
        const mappedLegacyRoles = legacyRoleMapping[user.role] || [];
        const hasLegacyRole = mappedLegacyRoles.some(role => allowedRoles.includes(role));

        if (!hasNewRole && !hasLegacyRole) {
            return sendAuthError(
                res,
                403,
                AuthErrorCode.ROLE_REQUIRED,
                `此操作需要以下角色之一: ${allowedRoles.join(', ')}`,
                req
            );
        }

        next();
    };
};

/**
 * 员工权限中间件（兼容别名）
 * @deprecated 建议使用 requireInternalUser
 */
export const requireEmployee = requireInternalUser;

// ═══════════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════════

// 导出别名，保持向后兼容
export const authMiddleware = authenticateToken;

// 导出安全日志工具（供其他模块使用）
export { securityLogger, SecurityLogger };
