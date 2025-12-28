import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AVAILABLE_VARIABLES } from '../config/messageVariables';

const router = Router();

// 使用配置文件中的变量数据
const VARIABLES_DATA = AVAILABLE_VARIABLES;

// 获取所有变量分类
router.get('/', authenticateToken, (req: any, res: any) => {
    try {
        const variables = Object.values(VARIABLES_DATA);
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
});

// 获取变量分类列表
router.get('/categories', authenticateToken, (req: any, res: any) => {
    try {
        const categories = Object.keys(VARIABLES_DATA).map(key => ({
            key,
            label: (VARIABLES_DATA as any)[key].label,
            description: (VARIABLES_DATA as any)[key].description,
            variableCount: (VARIABLES_DATA as any)[key].variables.length
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
});

// 根据分类获取变量
router.get('/category/:category', authenticateToken, (req: any, res: any) => {
    try {
        const { category } = req.params;
        const variables = (VARIABLES_DATA as any)[category];

        if (!variables) {
            return res.status(404).json({
                success: false,
                message: '变量分类不存在'
            });
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
});

export default router;