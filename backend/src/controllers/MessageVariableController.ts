import { Request, Response } from 'express';
import {
    getAllVariables,
    getVariablesByCategory,
    getVariablesByBusinessType,
    MESSAGE_VARIABLES
} from '../config/messageVariables';

/**
 * 消息变量控制器
 */
export class MessageVariableController {
    /**
     * 获取所有变量分类
     */
    static async getAllVariables(req: Request, res: Response): Promise<void> {
        try {
            const variables = getAllVariables();
            res.json({
                success: true,
                data: variables
            });
        } catch (error) {
            console.error('获取变量列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取变量列表失败'
            });
        }
    }

    /**
     * 根据分类获取变量
     */
    static async getVariablesByCategory(req: Request, res: Response): Promise<void> {
        try {
            const { category } = req.params;
            const variables = getVariablesByCategory(category);

            if (!variables) {
                res.status(404).json({
                    success: false,
                    message: '变量分类不存在'
                });
                return;
            }

            res.json({
                success: true,
                data: variables
            });
        } catch (error) {
            console.error('获取分类变量失败:', error);
            res.status(500).json({
                success: false,
                message: '获取分类变量失败'
            });
        }
    }

    /**
     * 根据业务类型获取相关变量
     */
    static async getVariablesByBusinessType(req: Request, res: Response): Promise<void> {
        try {
            const { businessType } = req.params;
            const variables = getVariablesByBusinessType(businessType);

            res.json({
                success: true,
                data: variables
            });
        } catch (error) {
            console.error('获取业务变量失败:', error);
            res.status(500).json({
                success: false,
                message: '获取业务变量失败'
            });
        }
    }

    /**
     * 获取变量分类列表
     */
    static async getVariableCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = Object.keys(MESSAGE_VARIABLES).map(key => ({
                key,
                label: MESSAGE_VARIABLES[key].label,
                description: MESSAGE_VARIABLES[key].description,
                variableCount: MESSAGE_VARIABLES[key].variables.length
            }));

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('获取变量分类失败:', error);
            res.status(500).json({
                success: false,
                message: '获取变量分类失败'
            });
        }
    }

    /**
     * 搜索变量
     */
    static async searchVariables(req: Request, res: Response): Promise<void> {
        try {
            const { keyword } = req.query;

            if (!keyword || typeof keyword !== 'string') {
                res.status(400).json({
                    success: false,
                    message: '请提供搜索关键词'
                });
                return;
            }

            const allVariables = getAllVariables();
            const searchResults: any[] = [];

            allVariables.forEach(category => {
                const matchedVariables = category.variables.filter(variable =>
                    variable.key.toLowerCase().includes(keyword.toLowerCase()) ||
                    variable.label.toLowerCase().includes(keyword.toLowerCase()) ||
                    variable.description.toLowerCase().includes(keyword.toLowerCase())
                );

                if (matchedVariables.length > 0) {
                    searchResults.push({
                        ...category,
                        variables: matchedVariables
                    });
                }
            });

            res.json({
                success: true,
                data: searchResults,
                total: searchResults.reduce((sum, category) => sum + category.variables.length, 0)
            });
        } catch (error) {
            console.error('搜索变量失败:', error);
            res.status(500).json({
                success: false,
                message: '搜索变量失败'
            });
        }
    }
}

export default MessageVariableController;
