import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { IMessage } from '../models/Message';
import mongoose from 'mongoose';

// WebSocket事件类型
export enum WebSocketEvents {
    // 连接事件
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',

    // 认证事件
    AUTHENTICATE = 'authenticate',
    AUTHENTICATED = 'authenticated',
    AUTH_ERROR = 'auth_error',

    // 消息事件
    NEW_MESSAGE = 'new_message',
    MESSAGE_READ = 'message_read',
    MESSAGE_UPDATED = 'message_updated',
    MESSAGE_DELETED = 'message_deleted',

    // 房间事件
    JOIN_ROOM = 'join_room',
    LEAVE_ROOM = 'leave_room',

    // 系统事件
    SYSTEM_NOTIFICATION = 'system_notification',
    USER_ONLINE = 'user_online',
    USER_OFFLINE = 'user_offline'
}

// 用户连接信息
interface UserConnection {
    userId: string;
    username: string;
    role: string;
    departmentId?: string;
    socketId: string;
    connectedAt: Date;
    lastActivity: Date;
}

// 房间类型
export enum RoomType {
    USER = 'user',           // 用户个人房间
    DEPARTMENT = 'dept',     // 部门房间
    ROLE = 'role',          // 角色房间
    SYSTEM = 'system'       // 系统广播房间
}

export class WebSocketService {
    private io: SocketIOServer;
    private connectedUsers: Map<string, UserConnection> = new Map();
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupEventHandlers();
        console.log('🔌 WebSocket服务已初始化');
    }

    /**
     * 设置事件处理器
     */
    private setupEventHandlers(): void {
        this.io.on(WebSocketEvents.CONNECTION, (socket: Socket) => {
            console.log(`🔗 新的WebSocket连接: ${socket.id}`);

            // 认证处理
            socket.on(WebSocketEvents.AUTHENTICATE, async (data) => {
                await this.handleAuthentication(socket, data);
            });

            // 加入房间
            socket.on(WebSocketEvents.JOIN_ROOM, (data) => {
                this.handleJoinRoom(socket, data);
            });

            // 离开房间
            socket.on(WebSocketEvents.LEAVE_ROOM, (data) => {
                this.handleLeaveRoom(socket, data);
            });

            // 消息已读
            socket.on(WebSocketEvents.MESSAGE_READ, (data) => {
                this.handleMessageRead(socket, data);
            });

            // 断开连接
            socket.on(WebSocketEvents.DISCONNECT, () => {
                this.handleDisconnect(socket);
            });

            // 心跳检测
            socket.on('ping', () => {
                socket.emit('pong');
                this.updateUserActivity(socket.id);
            });
        });
    }

    /**
     * 处理用户认证
     */
    private async handleAuthentication(socket: Socket, data: { token: string }): Promise<void> {
        try {
            const { token } = data;

            if (!token) {
                socket.emit(WebSocketEvents.AUTH_ERROR, { message: '缺少认证token' });
                return;
            }

            // 验证JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

            // 从数据库获取用户信息
            const user = await mongoose.connection.db?.collection('users').findOne({
                _id: new mongoose.Types.ObjectId(decoded.userId)
            });

            if (!user) {
                socket.emit(WebSocketEvents.AUTH_ERROR, { message: '用户不存在' });
                return;
            }

            // 存储用户连接信息
            const userConnection: UserConnection = {
                userId: user._id.toString(),
                username: user.username,
                role: user.role,
                departmentId: user.departmentId,
                socketId: socket.id,
                connectedAt: new Date(),
                lastActivity: new Date()
            };

            this.connectedUsers.set(socket.id, userConnection);

            // 维护用户socket映射
            if (!this.userSockets.has(userConnection.userId)) {
                this.userSockets.set(userConnection.userId, new Set());
            }
            this.userSockets.get(userConnection.userId)!.add(socket.id);

            // 加入用户个人房间
            socket.join(this.getUserRoom(userConnection.userId));

            // 根据角色和部门加入相应房间
            if (userConnection.role) {
                socket.join(this.getRoleRoom(userConnection.role));
            }
            if (userConnection.departmentId) {
                socket.join(this.getDepartmentRoom(userConnection.departmentId));
            }

            // 加入系统广播房间
            socket.join(this.getSystemRoom());

            // 发送认证成功事件
            socket.emit(WebSocketEvents.AUTHENTICATED, {
                userId: userConnection.userId,
                username: userConnection.username,
                connectedAt: userConnection.connectedAt
            });

            // 广播用户上线事件（给管理员）
            this.broadcastToRole('admin', WebSocketEvents.USER_ONLINE, {
                userId: userConnection.userId,
                username: userConnection.username,
                connectedAt: userConnection.connectedAt
            });

            console.log(`✅ 用户认证成功: ${userConnection.username} (${userConnection.userId})`);

        } catch (error) {
            console.error('WebSocket认证失败:', error);
            socket.emit(WebSocketEvents.AUTH_ERROR, { message: '认证失败' });
        }
    }

    /**
     * 处理加入房间
     */
    private handleJoinRoom(socket: Socket, data: { roomType: string; roomId: string }): void {
        const userConnection = this.connectedUsers.get(socket.id);
        if (!userConnection) {
            socket.emit('error', { message: '未认证的连接' });
            return;
        }

        const { roomType, roomId } = data;
        const roomName = this.getRoomName(roomType as RoomType, roomId);

        // 权限检查
        if (!this.canJoinRoom(userConnection, roomType as RoomType, roomId)) {
            socket.emit('error', { message: '无权限加入该房间' });
            return;
        }

        socket.join(roomName);
        console.log(`📍 用户 ${userConnection.username} 加入房间: ${roomName}`);
    }

    /**
     * 处理离开房间
     */
    private handleLeaveRoom(socket: Socket, data: { roomType: string; roomId: string }): void {
        const { roomType, roomId } = data;
        const roomName = this.getRoomName(roomType as RoomType, roomId);

        socket.leave(roomName);
        console.log(`📤 Socket ${socket.id} 离开房间: ${roomName}`);
    }

    /**
     * 处理消息已读
     */
    private handleMessageRead(socket: Socket, data: { messageId: string }): void {
        const userConnection = this.connectedUsers.get(socket.id);
        if (!userConnection) return;

        // 广播消息已读状态给发送者
        this.io.emit(WebSocketEvents.MESSAGE_READ, {
            messageId: data.messageId,
            readBy: userConnection.userId,
            readAt: new Date()
        });
    }

    /**
     * 处理断开连接
     */
    private handleDisconnect(socket: Socket): void {
        const userConnection = this.connectedUsers.get(socket.id);

        if (userConnection) {
            // 从用户socket映射中移除
            const userSockets = this.userSockets.get(userConnection.userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    this.userSockets.delete(userConnection.userId);

                    // 广播用户下线事件（给管理员）
                    this.broadcastToRole('admin', WebSocketEvents.USER_OFFLINE, {
                        userId: userConnection.userId,
                        username: userConnection.username,
                        disconnectedAt: new Date()
                    });
                }
            }

            this.connectedUsers.delete(socket.id);
            console.log(`🔌 用户断开连接: ${userConnection.username} (${socket.id})`);
        }
    }

    /**
     * 更新用户活动时间
     */
    private updateUserActivity(socketId: string): void {
        const userConnection = this.connectedUsers.get(socketId);
        if (userConnection) {
            userConnection.lastActivity = new Date();
        }
    }

    /**
     * 发送消息给特定用户
     */
    public sendToUser(userId: string, event: string, data: any): void {
        const roomName = this.getUserRoom(userId);
        this.io.to(roomName).emit(event, data);
    }

    /**
     * 发送消息给部门
     */
    public sendToDepartment(departmentId: string, event: string, data: any): void {
        const roomName = this.getDepartmentRoom(departmentId);
        this.io.to(roomName).emit(event, data);
    }

    /**
     * 发送消息给角色
     */
    public sendToRole(role: string, event: string, data: any): void {
        const roomName = this.getRoleRoom(role);
        this.io.to(roomName).emit(event, data);
    }

    /**
     * 系统广播
     */
    public broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }

    /**
     * 广播给角色（不包括发送者）
     */
    private broadcastToRole(role: string, event: string, data: any): void {
        const roomName = this.getRoleRoom(role);
        this.io.to(roomName).emit(event, data);
    }

    /**
     * 推送新消息
     */
    public pushMessage(message: IMessage): void {
        const messageData = {
            id: message._id,
            title: message.title,
            content: message.content,
            summary: message.summary,
            type: message.type,
            category: message.category,
            priority: message.priority,
            senderName: message.senderName,
            recipientId: message.recipientId,
            recipientType: message.recipientType,
            createdAt: message.createdAt,
            actions: message.actions,
            metadata: message.metadata
        };

        // 根据接收者类型推送消息
        switch (message.recipientType) {
            case 'user':
                this.sendToUser(message.recipientId, WebSocketEvents.NEW_MESSAGE, messageData);
                break;
            case 'role':
                this.sendToRole(message.recipientId, WebSocketEvents.NEW_MESSAGE, messageData);
                break;
            case 'department':
                this.sendToDepartment(message.recipientId, WebSocketEvents.NEW_MESSAGE, messageData);
                break;
        }

        console.log(`📨 推送消息: ${message.title} -> ${message.recipientType}:${message.recipientId}`);
    }

    /**
     * 获取在线用户列表
     */
    public getOnlineUsers(): UserConnection[] {
        return Array.from(this.connectedUsers.values());
    }

    /**
     * 获取用户是否在线
     */
    public isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    /**
     * 获取在线用户数量
     */
    public getOnlineUserCount(): number {
        return this.userSockets.size;
    }

    // 房间名称生成方法
    private getUserRoom(userId: string): string {
        return `${RoomType.USER}:${userId}`;
    }

    private getDepartmentRoom(departmentId: string): string {
        return `${RoomType.DEPARTMENT}:${departmentId}`;
    }

    private getRoleRoom(role: string): string {
        return `${RoomType.ROLE}:${role}`;
    }

    private getSystemRoom(): string {
        return RoomType.SYSTEM;
    }

    private getRoomName(roomType: RoomType, roomId: string): string {
        return `${roomType}:${roomId}`;
    }

    /**
     * 检查用户是否可以加入房间
     */
    private canJoinRoom(userConnection: UserConnection, roomType: RoomType, roomId: string): boolean {
        switch (roomType) {
            case RoomType.USER:
                // 只能加入自己的用户房间
                return userConnection.userId === roomId;

            case RoomType.DEPARTMENT:
                // 只能加入自己的部门房间
                return userConnection.departmentId === roomId;

            case RoomType.ROLE:
                // 只能加入自己的角色房间
                return userConnection.role === roomId;

            case RoomType.SYSTEM:
                // 所有认证用户都可以加入系统房间
                return true;

            default:
                return false;
        }
    }

    /**
     * 获取Socket.IO实例
     */
    public getIO(): SocketIOServer {
        return this.io;
    }
}
