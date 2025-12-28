/**
 * AI 配置管理控制器
 * 
 * 管理 AI 工具集、数据模型、样例模板
 */

import { Request, Response } from 'express';
import AiTool from '../models/AiToolkit';
import AiDataModel from '../models/AiDataModel';
import AiTemplate from '../models/AiTemplate';
import AiMap from '../models/AiMap';

class AiConfigController {
    // ==================== 工具集管理 ====================
    
    async getTools(req: Request, res: Response) {
        try {
            const tools = await AiTool.find().sort({ order: 1 });
            res.json({ success: true, data: tools });
        } catch (error) {
            res.status(500).json({ success: false, error: '获取工具列表失败' });
        }
    }

    async createTool(req: Request, res: Response) {
        try {
            const tool = new AiTool(req.body);
            await tool.save();
            res.json({ success: true, data: tool });
        } catch (error) {
            res.status(500).json({ success: false, error: '创建工具失败' });
        }
    }

    async updateTool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tool = await AiTool.findByIdAndUpdate(id, req.body, { new: true });
            if (!tool) {
                return res.status(404).json({ success: false, error: '工具不存在' });
            }
            res.json({ success: true, data: tool });
        } catch (error) {
            res.status(500).json({ success: false, error: '更新工具失败' });
        }
    }

    async deleteTool(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AiTool.findByIdAndDelete(id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: '删除工具失败' });
        }
    }

    // ==================== 数据模型管理 ====================
    
    async getDataModels(req: Request, res: Response) {
        try {
            const models = await AiDataModel.find().sort({ order: 1 });
            res.json({ success: true, data: models });
        } catch (error) {
            res.status(500).json({ success: false, error: '获取数据模型列表失败' });
        }
    }

    async createDataModel(req: Request, res: Response) {
        try {
            const model = new AiDataModel(req.body);
            await model.save();
            res.json({ success: true, data: model });
        } catch (error) {
            res.status(500).json({ success: false, error: '创建数据模型失败' });
        }
    }

    async updateDataModel(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const model = await AiDataModel.findByIdAndUpdate(id, req.body, { new: true });
            if (!model) {
                return res.status(404).json({ success: false, error: '数据模型不存在' });
            }
            res.json({ success: true, data: model });
        } catch (error) {
            res.status(500).json({ success: false, error: '更新数据模型失败' });
        }
    }

    async deleteDataModel(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AiDataModel.findByIdAndDelete(id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: '删除数据模型失败' });
        }
    }

    // ==================== 样例模板管理 ====================
    
    async getTemplates(req: Request, res: Response) {
        try {
            const templates = await AiTemplate.find().sort({ order: 1 });
            res.json({ success: true, data: templates });
        } catch (error) {
            res.status(500).json({ success: false, error: '获取样例模板列表失败' });
        }
    }

    async createTemplate(req: Request, res: Response) {
        try {
            const template = new AiTemplate(req.body);
            await template.save();
            res.json({ success: true, data: template });
        } catch (error) {
            res.status(500).json({ success: false, error: '创建样例模板失败' });
        }
    }

    async updateTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const template = await AiTemplate.findByIdAndUpdate(id, req.body, { new: true });
            if (!template) {
                return res.status(404).json({ success: false, error: '样例模板不存在' });
            }
            res.json({ success: true, data: template });
        } catch (error) {
            res.status(500).json({ success: false, error: '更新样例模板失败' });
        }
    }

    async deleteTemplate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AiTemplate.findByIdAndDelete(id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: '删除样例模板失败' });
        }
    }

    // ==================== AI 地图管理 ====================
    
    async getMaps(req: Request, res: Response) {
        try {
            const maps = await AiMap.find().sort({ priority: -1, module: 1 });
            res.json({ success: true, data: maps });
        } catch (error) {
            res.status(500).json({ success: false, error: '获取 AI 地图列表失败' });
        }
    }

    async createMap(req: Request, res: Response) {
        try {
            const map = new AiMap(req.body);
            await map.save();
            res.json({ success: true, data: map });
        } catch (error) {
            res.status(500).json({ success: false, error: '创建 AI 地图失败' });
        }
    }

    async updateMap(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const map = await AiMap.findByIdAndUpdate(id, req.body, { new: true });
            if (!map) {
                return res.status(404).json({ success: false, error: 'AI 地图不存在' });
            }
            res.json({ success: true, data: map });
        } catch (error) {
            res.status(500).json({ success: false, error: '更新 AI 地图失败' });
        }
    }

    async deleteMap(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AiMap.findByIdAndDelete(id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: '删除 AI 地图失败' });
        }
    }
}

export default new AiConfigController();

