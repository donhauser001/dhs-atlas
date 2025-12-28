import ServiceProcess, { IServiceProcess, IProcessStep } from '../models/ServiceProcess'

export class ServiceProcessService {
    // 获取所有服务流程
    async getAllProcesses() {
        try {
            const processes = await ServiceProcess.find().sort({ createTime: -1 })
            return processes
        } catch (error) {
            throw new Error('获取服务流程列表失败')
        }
    }

    // 根据ID获取服务流程
    async getProcessById(id: string) {
        try {
            const process = await ServiceProcess.findById(id)
            if (!process) {
                throw new Error('服务流程不存在')
            }
            return process
        } catch (error) {
            throw new Error('获取服务流程详情失败')
        }
    }

    // 创建服务流程
    async createProcess(processData: {
        name: string
        description: string
        steps: IProcessStep[]
    }) {
        try {
            const process = new ServiceProcess(processData)
            await process.save()
            return process
        } catch (error) {
            throw new Error('创建服务流程失败')
        }
    }

    // 更新服务流程
    async updateProcess(id: string, updateData: {
        name?: string
        description?: string
        steps?: IProcessStep[]
    }) {
        try {
            const process = await ServiceProcess.findByIdAndUpdate(
                id,
                { ...updateData, updateTime: new Date() },
                { new: true }
            )
            if (!process) {
                throw new Error('服务流程不存在')
            }
            return process
        } catch (error) {
            throw new Error('更新服务流程失败')
        }
    }

    // 切换服务流程状态
    async toggleProcessStatus(id: string) {
        try {
            const process = await ServiceProcess.findById(id)
            if (!process) {
                throw new Error('服务流程不存在')
            }

            process.status = process.status === 'active' ? 'inactive' : 'active'
            process.updateTime = new Date()
            await process.save()
            return process
        } catch (error) {
            throw new Error('切换服务流程状态失败')
        }
    }

    // 删除服务流程
    async deleteProcess(id: string) {
        try {
            const process = await ServiceProcess.findByIdAndDelete(id)
            if (!process) {
                throw new Error('服务流程不存在')
            }
            return process
        } catch (error) {
            throw new Error('删除服务流程失败')
        }
    }

    // 搜索服务流程
    async searchProcesses(searchTerm: string) {
        try {
            const processes = await ServiceProcess.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            }).sort({ createTime: -1 })
            return processes
        } catch (error) {
            throw new Error('搜索服务流程失败')
        }
    }

    // 复制服务流程
    async copyProcess(id: string) {
        try {
            const originalProcess = await ServiceProcess.findById(id)
            if (!originalProcess) {
                throw new Error('服务流程不存在')
            }

            // 创建新的流程数据，复制所有字段但生成新的ID和时间戳
            const newProcessData = {
                name: `${originalProcess.name} - 副本`,
                description: originalProcess.description,
                steps: originalProcess.steps.map(step => ({
                    ...step,
                    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                })),
                status: 'active' as const
            }

            const newProcess = new ServiceProcess(newProcessData)
            await newProcess.save()
            return newProcess
        } catch (error) {
            throw new Error('复制服务流程失败')
        }
    }
}

export default new ServiceProcessService() 