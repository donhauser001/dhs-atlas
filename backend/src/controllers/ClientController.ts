import { Request, Response } from 'express';
import { ClientService } from '../services/ClientService';
import { CreateClientRequest, UpdateClientRequest, ClientQuery } from '../models/Client';

export class ClientController {
    // 获取客户列表
    static async getClients(req: Request, res: Response) {
        try {
            const query: ClientQuery = {
                search: req.query.search as string,
                status: req.query.status as string,
                category: req.query.category as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const result = await ClientService.getClients(query);

            return res.json({
                success: true,
                message: '获取客户列表成功',
                data: result.data,
                total: result.total
            });
        } catch (error) {
            console.error('获取客户列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取客户列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取客户
    static async getClientById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const client = await ClientService.getClientById(id);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: '客户不存在'
                });
            }

            return res.json({
                success: true,
                message: '获取客户信息成功',
                data: client
            });
        } catch (error) {
            console.error('获取客户信息失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取客户信息失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建客户
    static async createClient(req: Request, res: Response) {
        try {
            const clientData: CreateClientRequest = req.body;

            // 验证必填字段
            if (!clientData.name || !clientData.address || !clientData.invoiceType || !clientData.category) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必填字段'
                });
            }

            const newClient = await ClientService.createClient(clientData);

            return res.status(201).json({
                success: true,
                message: '客户创建成功',
                data: newClient
            });
        } catch (error) {
            console.error('创建客户失败:', error);
            return res.status(500).json({
                success: false,
                message: '创建客户失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新客户
    static async updateClient(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const clientData: UpdateClientRequest = req.body;

            const updatedClient = await ClientService.updateClient(id, clientData);

            if (!updatedClient) {
                return res.status(404).json({
                    success: false,
                    message: '客户不存在'
                });
            }

            return res.json({
                success: true,
                message: '客户信息更新成功',
                data: updatedClient
            });
        } catch (error) {
            console.error('更新客户失败:', error);
            return res.status(500).json({
                success: false,
                message: '更新客户失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除客户
    static async deleteClient(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const success = await ClientService.deleteClient(id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '客户不存在'
                });
            }

            return res.json({
                success: true,
                message: '客户删除成功'
            });
        } catch (error) {
            console.error('删除客户失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除客户失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 添加客户文件
    static async addClientFile(req: Request, res: Response) {
        try {
            const { clientId } = req.params;
            const { filePath, originalName, size } = req.body;

            if (!filePath || !originalName || size === undefined) {
                return res.status(400).json({
                    success: false,
                    message: '文件信息不完整'
                });
            }

            const fileInfo = {
                path: filePath,
                originalName: originalName,
                size: size
            };

            const success = await ClientService.addClientFile(clientId, fileInfo);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '客户不存在'
                });
            }

            return res.json({
                success: true,
                message: '文件添加成功'
            });
        } catch (error) {
            console.error('添加客户文件失败:', error);
            return res.status(500).json({
                success: false,
                message: '添加客户文件失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除客户文件
    static async removeClientFile(req: Request, res: Response) {
        try {
            const { clientId } = req.params;
            const { filePath } = req.body;

            if (!filePath) {
                return res.status(400).json({
                    success: false,
                    message: '文件路径不能为空'
                });
            }

            const success = await ClientService.removeClientFile(clientId, filePath);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '客户或文件不存在'
                });
            }

            return res.json({
                success: true,
                message: '文件删除成功'
            });
        } catch (error) {
            console.error('删除客户文件失败:', error);
            return res.status(500).json({
                success: false,
                message: '删除客户文件失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}