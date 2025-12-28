import { Request, Response } from 'express';
import { GeneratedContractService } from '../services/GeneratedContractService';
import { ContractQueryService } from '../services/ContractQueryService';
import { ContractFileService } from '../services/ContractFileService';
import { ContractExportService } from '../services/ContractExportService';
import { ContractHelpers } from '../utils/ContractHelpers';

/**
 * 重构后的合同控制器 - 使用分离的服务层
 * 
 * 职责：
 * - 处理HTTP请求和响应
 * - 参数验证和错误处理
 * - 调用相应的服务层方法
 * - 格式化返回数据
 */
class GeneratedContractController {
    // ===== 查询相关方法 =====

    /**
     * 获取生成的合同列表
     */
    static async getContracts(req: Request, res: Response) {
        try {
            const result = await ContractQueryService.getContracts(req.query);

            return res.json({
                success: true,
                data: result.contracts,
                pagination: result.pagination
            });
        } catch (error: any) {
            console.error('获取合同列表失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取合同列表失败'
            });
        }
    }

    /**
     * 根据ID获取合同详情
     */
    static async getContractById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contract = await ContractQueryService.getContractById(id);

            return res.json({
                success: true,
                data: contract
            });
        } catch (error: any) {
            console.error('获取合同详情失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '获取合同详情失败'
            });
        }
    }

    /**
     * 根据用户相关ID获取合同列表
     */
    static async getContractsByRelatedIds(req: Request, res: Response) {
        try {
            const result = await ContractQueryService.getContractsByRelatedIds(req.query);

            return res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('根据关联ID获取合同失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取相关合同失败'
            });
        }
    }

    /**
     * 获取合同统计
     */
    static async getContractStats(req: Request, res: Response) {
        try {
            const stats = await ContractQueryService.getContractStats();

            return res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            console.error('获取合同统计失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取统计失败'
            });
        }
    }

    // ===== 合同生成和管理方法 =====

    /**
     * 从模板和表单数据生成合同
     */
    static async generateFromTemplate(req: Request, res: Response) {
        try {
            const { templateId } = req.params;
            const { formData, name, description } = req.body;

            // 获取创建者信息
            const generatedBy = (req as any).user?.userId || 'system';

            // 准备合同数据
            const contractData = {
                formData,
                name,
                description,
                relatedIds: req.body.relatedIds || ContractHelpers.extractRelatedIds(formData)
            };

            console.log('🎯 使用的关联ID信息:', contractData.relatedIds);

            const contract = await GeneratedContractService.generateFromTemplate(
                templateId,
                contractData,
                generatedBy
            );

            return res.status(201).json({
                success: true,
                data: contract,
                message: '合同生成成功'
            });
        } catch (error: any) {
            console.error('生成合同失败:', error);

            if (error.message === '合同模板不存在' || error.message === '合同模板未启用') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '生成合同失败'
            });
        }
    }

    /**
     * 从表单提交记录生成合同
     */
    static async generateFromFormData(req: Request, res: Response) {
        try {
            const { templateId, formDataId } = req.params;
            const { name, description } = req.body;

            // 获取创建者信息
            const generatedBy = (req as any).user?.userId || 'system';

            // 准备合同数据
            const contractData = {
                formData: null, // 从表单提交记录生成时不需要formData
                name,
                description,
                relatedIds: req.body.relatedIds
            };

            const contract = await GeneratedContractService.generateFromFormData(
                templateId,
                formDataId,
                contractData,
                generatedBy
            );

            return res.status(201).json({
                success: true,
                data: contract,
                message: '合同生成成功'
            });
        } catch (error: any) {
            console.error('从提交记录生成合同失败:', error);

            if (error.message === '合同模板不存在' || error.message === '表单提交记录不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '生成合同失败'
            });
        }
    }

    /**
     * 更新合同信息
     */
    static async updateContract(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contract = await GeneratedContractService.updateContract(id, req.body);

            return res.json({
                success: true,
                data: contract,
                message: '合同更新成功'
            });
        } catch (error: any) {
            console.error('更新合同失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '更新合同失败'
            });
        }
    }

    /**
     * 更新合同内容（包括名称、描述、状态和正文）
     */
    static async updateContractContent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, status, content } = req.body;

            const contract = await GeneratedContractService.updateContractContent(id, {
                name,
                description,
                status,
                content
            });

            return res.json({
                success: true,
                data: contract,
                message: '合同内容更新成功'
            });
        } catch (error: any) {
            console.error('更新合同内容失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '更新合同内容失败'
            });
        }
    }

    /**
     * 更新合同状态
     */
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const contract = await GeneratedContractService.updateStatus(id, status);

            return res.json({
                success: true,
                data: contract,
                message: '状态更新成功'
            });
        } catch (error: any) {
            console.error('更新合同状态失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message === '无效的状态值') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '更新状态失败'
            });
        }
    }

    /**
     * 删除合同
     */
    static async deleteContract(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await GeneratedContractService.deleteContract(id);

            return res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            console.error('删除合同失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '删除合同失败'
            });
        }
    }

    // ===== 文件管理方法 =====

    /**
     * 上传签署文件
     */
    static async uploadSignedFile(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '未找到上传的文件'
                });
            }

            const contract = await ContractFileService.uploadSignedFile(id, req.file.path);

            return res.json({
                success: true,
                data: contract,
                message: '签署文件上传成功，合同状态已更新为已签署'
            });
        } catch (error: any) {
            console.error('上传签署文件失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '上传签署文件失败'
            });
        }
    }

    /**
     * 下载签署文件
     */
    static async downloadSignedFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const fileInfo = await ContractFileService.getSignedFileStream(id);

            // 设置响应头
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.contract.name + '-签署文件.pdf')}"`);

            // 发送文件
            return fileInfo.fileStream.pipe(res);
        } catch (error: any) {
            console.error('下载签署文件失败:', error);

            if (error.message === '合同不存在' || error.message === '该合同没有签署文件' || error.message === '签署文件不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '下载签署文件失败'
            });
        }
    }

    /**
     * 删除签署文件
     */
    static async deleteSignedFile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contract = await ContractFileService.deleteSignedFile(id);

            return res.json({
                success: true,
                data: contract,
                message: '签署文件删除成功'
            });
        } catch (error: any) {
            console.error('删除签署文件失败:', error);

            if (error.message === '合同不存在' || error.message === '该合同没有签署文件') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '删除签署文件失败'
            });
        }
    }

    // ===== 导出相关方法 =====

    /**
     * 导出合同为PDF
     */
    static async exportToPDF(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // 获取合同信息用于生成文件名
            const contract = await ContractQueryService.getContractById(id);

            // 生成PDF
            const pdfBuffer = await ContractExportService.exportToPDF(id);

            // 获取文件名
            const fileName = ContractExportService.getFileName(contract, 'pdf');

            // 设置响应头
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // 发送文件
            return res.send(pdfBuffer);
        } catch (error: any) {
            console.error('导出PDF失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '导出PDF失败',
                error: error.message
            });
        }
    }

    /**
     * 导出合同为Word文档
     */
    static async exportToWord(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // 获取合同信息用于生成文件名
            const contract = await ContractQueryService.getContractById(id);

            // 生成Word文档
            const wordBuffer = await ContractExportService.exportToWord(id);

            // 获取文件名
            const fileName = ContractExportService.getFileName(contract, 'docx');

            // 设置响应头
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader('Content-Length', wordBuffer.length);

            // 发送文件
            return res.send(wordBuffer);
        } catch (error: any) {
            console.error('导出Word失败:', error);

            if (error.message === '合同不存在') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '导出Word失败',
                error: error.message
            });
        }
    }
}

export default GeneratedContractController;
