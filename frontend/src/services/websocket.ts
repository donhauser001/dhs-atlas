import { io, Socket } from 'socket.io-client';

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

// 消息动作接口
export interface MessageAction {
    type: string;
    label: string;
    url?: string;
    data?: Record<string, unknown>;
}

// 消息数据接口
export interface MessageData {
    id: string;
    title: string;
    content: string;
    summary?: string;
    type: string;
    category: string;
    priority: string;
    senderName: string;
    recipientId: string;
    recipientType: string;
    createdAt: string;
    actions?: MessageAction[];
    metadata?: Record<string, unknown>;
}

// 事件回调类型
type EventCallback = (data: unknown) => void;

class WebSocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private isAuthenticated = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // 1秒
    private eventHandlers: Map<string, EventCallback[]> = new Map();

    /**
     * 连接WebSocket服务器
     */
    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // 如果已经连接，先断开
                if (this.socket) {
                    this.disconnect();
                }

                // 创建Socket连接
                this.socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    forceNew: true
                });

                // 连接成功
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    // 发送认证信息
                    this.socket!.emit(WebSocketEvents.AUTHENTICATE, { token });
                });

                // 认证成功
                this.socket.on(WebSocketEvents.AUTHENTICATED, () => {
                    this.isAuthenticated = true;
                    resolve();
                });

                // 认证失败
                this.socket.on(WebSocketEvents.AUTH_ERROR, (error) => {
                    console.error('❌ WebSocket认证失败:', error);
                    this.isAuthenticated = false;
                    reject(new Error(error.message || '认证失败'));
                });

                // 连接错误
                this.socket.on('connect_error', (error) => {
                    console.error('🔌 WebSocket连接错误:', error);
                    this.isConnected = false;
                    this.isAuthenticated = false;

                    // 自动重连
                    this.handleReconnect();

                    reject(error);
                });

                // 断开连接
                this.socket.on('disconnect', (reason) => {
                    this.isConnected = false;
                    this.isAuthenticated = false;

                    // 如果不是主动断开，尝试重连
                    if (reason !== 'io client disconnect') {
                        this.handleReconnect();
                    }
                });

                // 设置默认事件处理器
                this.setupDefaultEventHandlers();

            } catch (error) {
                console.error('WebSocket连接失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 断开WebSocket连接
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
    }

    /**
     * 处理重连
     */
    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避


            setTimeout(() => {
                if (this.socket && !this.isConnected) {
                    this.socket.connect();
                }
            }, delay);
        } else {
            console.error('❌ WebSocket重连失败，已达到最大重试次数');
        }
    }

    /**
     * 设置默认事件处理器
     */
    private setupDefaultEventHandlers(): void {
        if (!this.socket) return;

        // 新消息事件
        this.socket.on(WebSocketEvents.NEW_MESSAGE, (messageData: MessageData) => {
            this.triggerEvent(WebSocketEvents.NEW_MESSAGE, messageData);
        });

        // 消息已读事件
        this.socket.on(WebSocketEvents.MESSAGE_READ, (data) => {
            this.triggerEvent(WebSocketEvents.MESSAGE_READ, data);
        });

        // 系统通知事件
        this.socket.on(WebSocketEvents.SYSTEM_NOTIFICATION, (data) => {
            this.triggerEvent(WebSocketEvents.SYSTEM_NOTIFICATION, data);
        });

        // 用户上线事件
        this.socket.on(WebSocketEvents.USER_ONLINE, (data) => {
            this.triggerEvent(WebSocketEvents.USER_ONLINE, data);
        });

        // 用户下线事件
        this.socket.on(WebSocketEvents.USER_OFFLINE, (data) => {
            this.triggerEvent(WebSocketEvents.USER_OFFLINE, data);
        });

        // 心跳
        this.socket.on('pong', () => {
            // 心跳响应，保持连接活跃
        });
    }

    /**
     * 添加事件监听器
     */
    on(event: string, callback: EventCallback): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(event: string, callback?: EventCallback): void {
        if (!this.eventHandlers.has(event)) return;

        if (callback) {
            const handlers = this.eventHandlers.get(event)!;
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        } else {
            this.eventHandlers.delete(event);
        }
    }

    /**
     * 触发事件
     */
    private triggerEvent(event: string, data: unknown): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理器执行失败 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 加入房间
     */
    joinRoom(roomType: string, roomId: string): void {
        if (this.socket && this.isAuthenticated) {
            this.socket.emit(WebSocketEvents.JOIN_ROOM, { roomType, roomId });
        }
    }

    /**
     * 离开房间
     */
    leaveRoom(roomType: string, roomId: string): void {
        if (this.socket && this.isAuthenticated) {
            this.socket.emit(WebSocketEvents.LEAVE_ROOM, { roomType, roomId });
        }
    }

    /**
     * 标记消息为已读
     */
    markMessageAsRead(messageId: string): void {
        if (this.socket && this.isAuthenticated) {
            this.socket.emit(WebSocketEvents.MESSAGE_READ, { messageId });
        }
    }

    /**
     * 发送心跳
     */
    ping(): void {
        if (this.socket && this.isConnected) {
            this.socket.emit('ping');
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus(): { isConnected: boolean; isAuthenticated: boolean } {
        return {
            isConnected: this.isConnected,
            isAuthenticated: this.isAuthenticated
        };
    }

    /**
     * 获取Socket实例
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// 创建单例实例
export const webSocketService = new WebSocketService();

// 导出服务类
export default WebSocketService;
