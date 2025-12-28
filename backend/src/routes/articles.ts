import express from 'express';
import ArticleController from '../controllers/ArticleController';

const router = express.Router();

// 获取文章列表
router.get('/', ArticleController.getArticles);

// 获取文章详情
router.get('/:id', ArticleController.getArticleById);

// 创建文章
router.post('/', ArticleController.createArticle);

// 更新文章
router.put('/:id', ArticleController.updateArticle);

// 删除文章
router.delete('/:id', ArticleController.deleteArticle);

// 切换文章状态
router.put('/:id/toggle-status', ArticleController.toggleStatus);

// 设置置顶状态
router.put('/:id/toggle-top', ArticleController.toggleTop);

// 设置推荐状态
router.put('/:id/toggle-recommend', ArticleController.toggleRecommend);

// 增加浏览量
router.put('/:id/increment-view', ArticleController.incrementViewCount);

// 获取分类统计
router.get('/stats/categories', ArticleController.getCategoryStats);

// 获取热门文章
router.get('/popular/list', ArticleController.getPopularArticles);

// 获取推荐文章
router.get('/recommended/list', ArticleController.getRecommendedArticles);

export default router; 