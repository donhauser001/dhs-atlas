import { Request, Response, NextFunction } from 'express';
import { Message, IMessage } from '../models/Message';
import { MessageTemplate, IMessageTemplate } from '../models/MessageTemplate';
import mongoose from 'mongoose';

// 扩展Request接口以包含消息相关信息
declare global {
    namespace Express {
        interface Request {
            message?: IMessage;
            messageTemplate?: IMessageTemplate;
        }
    }
}

/**
 * 检查用户是否可以查看消息
 */
export const canViewMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: '未授权访问'
            });
            return;
        }

        const message = await Message.findById(id);

        if (!message) {
            res.status(404).json({
                success: false,
                message: '消息不存在'
            });
            return;
        }

        // 检查权限
        const hasPermission = await checkMessageViewPermission(userId, userRole || '', message);

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: '无权限查看此消息'
            });
            return;
        }

        // 将消息添加到请求对象中
        req.message = message;
        next();

    } catch (error) {
        console.error('检查消息查看权限失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

/**
 * 检查用户是否可以操作消息
 */
export const canOperateMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const operation = req.method.toLowerCase();

        if (!userId) {
            res.status(401).json({
                success: false,
                message: '未授权访问'
            });
            return;
        }

        const message = await Message.findById(id);

        if (!message) {
            res.status(404).json({
                success: false,
                message: '消息不存在'
            });
            return;
        }

        // 检查操作权限
        const hasPermission = await checkMessageOperatePermission(userId, userRole || '', message, operation);

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: '无权限执行此操作'
            });
            return;
        }

        req.message = message;
        next();

    } catch (error) {
        console.error('检查消息操作权限失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

/**
 * 检查用户是否可以管理消息模板
 */
export const canManageTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: '未授权访问'
            });
            return;
        }

        // 检查模板管理权限
        const hasPermission = await checkTemplateManagePermission(userId, userRole || '');

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: '无权限管理消息模板'
            });
            return;
        }

        next();

    } catch (error) {
        console.error('检查模板管理权限失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

/**
 * 检查用户是否可以操作特定模板
 */
export const canOperateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: '未授权访问'
            });
            return;
        }

        const template = await MessageTemplate.findById(id);

        if (!template) {
            res.status(404).json({
                success: false,
                message: '消息模板不存在'
            });
            return;
        }

        // 检查模板操作权限
        const hasPermission = await checkTemplateOperatePermission(userId, userRole || '', template);

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: '无权限操作此模板'
            });
            return;
        }

        req.messageTemplate = template;
        next();

    } catch (error) {
        console.error('检查模板操作权限失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

/**
 * 检查用户是否可以发送消息给指定接收者
 */
export const canSendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { recipientId, recipientType } = req.body;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: '未授权访问'
            });
            return;
        }

        if (!recipientId || !recipientType) {
            res.status(400).json({
                success: false,
                message: '接收者信息不完整'
            });
            return;
        }

        // 检查发送权限
        const hasPermission = await checkSendMessagePermission(userId, userRole || '', recipientId, recipientType);

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: '无权限发送消息给指定接收者'
            });
            return;
        }

        next();

    } catch (error) {
        console.error('检查发送消息权限失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

// 权限检查辅助函数

/**
 * 检查消息查看权限
 */
async function checkMessageViewPermission(userId: string, userRole: string, message: IMessage): Promise<boolean> {
    // 管理员可以查看所有消息
    if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
    }

    // 用户只能查看发送给自己的消息
    if (message.recipientType === 'user' && message.recipientId === userId) {
        return true;
    }

    // 如果是发送给角色或部门的消息，检查用户是否属于该角色或部门
    if (message.recipientType === 'role') {
        const user = await mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
        return user?.role === message.recipientId;
    }

    if (message.recipientType === 'department') {
        const user = await mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
        return user?.departmentId === message.recipientId;
    }

    return false;
}

/**
 * 检查消息操作权限
 */
async function checkMessageOperatePermission(
    userId: string,
    userRole: string,
    message: IMessage,
    operation: string
): Promise<boolean> {
    // 管理员可以操作所有消息
    if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
    }

    // 发送者可以撤回未读消息
    if (operation === 'delete' && message.senderId === userId && message.status === 'unread') {
        return true;
    }

    // 接收者可以操作自己的消息
    if (message.recipientType === 'user' && message.recipientId === userId) {
        return ['patch', 'put'].includes(operation); // 允许更新状态
    }

    return false;
}

/**
 * 检查模板管理权限
 */
async function checkTemplateManagePermission(userId: string, userRole: string): Promise<boolean> {
    // 只有管理员可以管理消息模板
    return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * 检查模板操作权限
 */
async function checkTemplateOperatePermission(
    userId: string,
    userRole: string,
    template: IMessageTemplate
): Promise<boolean> {
    // 管理员可以操作所有模板
    if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
    }

    // 创建者可以操作自己创建的模板
    return template.createdBy === userId;
}

/**
 * 检查发送消息权限
 */
async function checkSendMessagePermission(
    userId: string,
    userRole: string,
    recipientId: string,
    recipientType: string
): Promise<boolean> {
    // 管理员可以发送消息给任何人
    if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
    }

    // 部门经理可以发送消息给部门成员
    if (userRole === 'manager') {
        const user = await mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
        if (recipientType === 'user') {
            const recipient = await mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(recipientId) });
            return user?.departmentId === recipient?.departmentId;
        }
        if (recipientType === 'department') {
            return user?.departmentId === recipientId;
        }
    }

    // 普通用户只能发送消息给同部门用户
    if (recipientType === 'user') {
        const [sender, recipient] = await Promise.all([
            mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) }),
            mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(recipientId) })
        ]);
        return sender?.departmentId === recipient?.departmentId;
    }

    return false;
}

/**
 * 过滤用户可见的消息列表
 */
export const filterViewableMessages = async (
    userId: string,
    userRole: string,
    messages: IMessage[]
): Promise<IMessage[]> => {
    if (userRole === 'admin' || userRole === 'super_admin') {
        return messages;
    }

    const user = await mongoose.connection.db?.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!user) return [];

    return messages.filter(message => {
        if (message.recipientType === 'user' && message.recipientId === userId) {
            return true;
        }
        if (message.recipientType === 'role' && message.recipientId === user.role) {
            return true;
        }
        if (message.recipientType === 'department' && message.recipientId === user.departmentId) {
            return true;
        }
        return false;
    });
};
