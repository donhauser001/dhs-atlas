import { Request, Response } from 'express';
import ArticleService, { CreateArticleRequest, UpdateArticleRequest, ArticleQuery } from '../services/ArticleService';

class ArticleController {
    // 获取文章列表
    async getArticles(req: Request, res: Response) {
        try {
            const query: ArticleQuery = {
                search: req.query.search as string,
                category: req.query.category as string,
                status: req.query.status as string,
                authorId: req.query.authorId as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };

            const result = await ArticleService.getArticles(query);

            res.json({
                success: true,
                data: result.articles,
                total: result.total,
                page: query.page,
                limit: query.limit
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取文章列表失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 根据ID获取文章
    async getArticleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const article = await ArticleService.getArticleById(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '获取文章详情失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 创建文章
    async createArticle(req: Request, res: Response) {
        try {
            const articleData: CreateArticleRequest = req.body;

            // 验证必填字段
            if (!articleData.title || !articleData.content || !articleData.category) {
                return res.status(400).json({
                    success: false,
                    message: '标题、内容和分类为必填字段'
                });
            }

            const article = await ArticleService.createArticle(articleData);

            return res.status(201).json({
                success: true,
                message: '文章创建成功',
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '创建文章失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 更新文章
    async updateArticle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: UpdateArticleRequest = req.body;

            const article = await ArticleService.updateArticle(id, updateData);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                message: '文章更新成功',
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '更新文章失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 删除文章
    async deleteArticle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const success = await ArticleService.deleteArticle(id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                message: '文章删除成功'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '删除文章失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 切换文章状态
    async toggleStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const article = await ArticleService.toggleArticleStatus(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                message: '状态切换成功',
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '切换状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 设置置顶状态
    async toggleTop(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const article = await ArticleService.toggleTopStatus(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                message: '置顶状态切换成功',
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '切换置顶状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 设置推荐状态
    async toggleRecommend(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const article = await ArticleService.toggleRecommendStatus(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: '文章不存在'
                });
            }

            return res.json({
                success: true,
                message: '推荐状态切换成功',
                data: article
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: '切换推荐状态失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 增加浏览量
    async incrementViewCount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await ArticleService.incrementViewCount(id);

            res.json({
                success: true,
                message: '浏览量更新成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新浏览量失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取分类统计
    async getCategoryStats(req: Request, res: Response) {
        try {
            const stats = await ArticleService.getCategoryStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取分类统计失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取热门文章
    async getPopularArticles(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const articles = await ArticleService.getPopularArticles(limit);

            res.json({
                success: true,
                data: articles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取热门文章失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    // 获取推荐文章
    async getRecommendedArticles(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const articles = await ArticleService.getRecommendedArticles(limit);

            res.json({
                success: true,
                data: articles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取推荐文章失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }
}

export default new ArticleController();