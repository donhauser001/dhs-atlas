import Client, { IClient, CreateClientRequest, UpdateClientRequest, ClientQuery } from '../models/Client'

export class ClientService {
    // 获取客户列表
    static async getClients(query: ClientQuery = {}): Promise<{ data: IClient[]; total: number }> {
        try {
            let filter: any = {}

            // 搜索过滤
            if (query.search) {
                filter.name = { $regex: query.search, $options: 'i' }
            }

            // 状态过滤
            if (query.status && query.status !== 'all') {
                filter.status = query.status
            }

            // 分类过滤
            if (query.category && query.category !== 'all') {
                filter.category = query.category
            }

            const total = await Client.countDocuments(filter)

            // 分页
            let queryBuilder = Client.find(filter).sort({ createTime: -1 })

            if (query.page && query.limit) {
                const skip = (query.page - 1) * query.limit
                queryBuilder = queryBuilder.skip(skip).limit(query.limit)
            }

            const data = await queryBuilder.exec()

            return { data, total }
        } catch (error) {
            console.error('获取客户列表失败:', error)
            throw error
        }
    }

    // 根据ID获取客户
    static async getClientById(id: string): Promise<IClient | null> {
        try {
            return await Client.findById(id)
        } catch (error) {
            console.error('获取客户信息失败:', error)
            throw error
        }
    }

    // 创建客户
    static async createClient(clientData: CreateClientRequest): Promise<IClient> {
        try {
            const newClient = new Client({
                ...clientData,
                createTime: new Date().toISOString().split('T')[0],
                updateTime: new Date().toISOString().split('T')[0]
            })

            return await newClient.save()
        } catch (error) {
            console.error('创建客户失败:', error)
            throw error
        }
    }

    // 更新客户
    static async updateClient(id: string, clientData: UpdateClientRequest): Promise<IClient | null> {
        try {
            const updatedClient = await Client.findByIdAndUpdate(
                id,
                {
                    ...clientData,
                    updateTime: new Date().toISOString().split('T')[0]
                },
                { new: true }
            )

            return updatedClient
        } catch (error) {
            console.error('更新客户失败:', error)
            throw error
        }
    }

    // 删除客户
    static async deleteClient(id: string): Promise<boolean> {
        try {
            const result = await Client.findByIdAndDelete(id)
            return !!result
        } catch (error) {
            console.error('删除客户失败:', error)
            throw error
        }
    }

    // 添加客户文件
    static async addClientFile(clientId: string, fileInfo: { path: string; originalName: string; size: number }): Promise<boolean> {
        try {
            const result = await Client.findByIdAndUpdate(
                clientId,
                {
                    $push: { files: fileInfo },
                    updateTime: new Date().toISOString().split('T')[0]
                }
            )
            return !!result
        } catch (error) {
            console.error('添加客户文件失败:', error)
            throw error
        }
    }

    // 删除客户文件
    static async removeClientFile(clientId: string, filePath: string): Promise<boolean> {
        try {
            const result = await Client.findByIdAndUpdate(
                clientId,
                {
                    $pull: { files: { path: filePath } },
                    updateTime: new Date().toISOString().split('T')[0]
                }
            )
            return !!result
        } catch (error) {
            console.error('删除客户文件失败:', error)
            throw error
        }
    }
} 