import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function testArticlePages() {
    console.log('🧪 开始测试文章页面功能...\n');

    try {
        // 1. 创建测试文章
        console.log('1. 创建测试文章...');
        const testArticle = {
            title: '页面形式编辑器测试文章',
            content: `这是一篇用于测试页面形式编辑器的文章。

## 测试内容

### 功能特点
- 独立的编辑页面
- 左右分栏布局
- 实时预览功能
- SEO设置面板

### 技术实现
1. React Router 路由管理
2. Ant Design 组件库
3. TypeScript 类型安全
4. 响应式设计

## 总结

页面形式的编辑器提供了更好的用户体验，适合长文章的编辑工作。`,
            summary: '测试页面形式文章编辑器的功能特点和技术实现',
            category: 'blog',
            tags: ['测试', '编辑器', '页面形式'],
            author: '测试用户',
            authorId: 'test-user-id',
            seoTitle: '页面形式编辑器测试',
            seoKeywords: '编辑器,测试,页面形式',
            seoDescription: '测试页面形式文章编辑器的功能特点和技术实现'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/articles`, testArticle);
        console.log('✅ 创建测试文章成功:', createResponse.data.message);
        const articleId = createResponse.data.data._id;
        console.log('   文章ID:', articleId);

        // 2. 获取文章详情
        console.log('\n2. 获取文章详情...');
        const detailResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        console.log('✅ 获取文章详情成功');
        console.log('   文章标题:', detailResponse.data.data.title);

        // 3. 更新文章
        console.log('\n3. 更新文章...');
        const updateData = {
            title: '更新后的页面形式编辑器测试文章',
            content: detailResponse.data.data.content + '\n\n## 更新内容\n\n这是通过页面形式编辑器更新的内容。',
            status: 'published'
        };
        const updateResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}`, updateData);
        console.log('✅ 更新文章成功:', updateResponse.data.message);

        // 4. 设置置顶和推荐
        console.log('\n4. 设置置顶和推荐...');
        await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-top`);
        await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-recommend`);
        console.log('✅ 设置置顶和推荐成功');

        // 5. 增加浏览量
        console.log('\n5. 增加浏览量...');
        await axios.put(`${API_BASE_URL}/articles/${articleId}/increment-view`);
        console.log('✅ 增加浏览量成功');

        // 6. 获取最终文章信息
        console.log('\n6. 获取最终文章信息...');
        const finalResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        const finalArticle = finalResponse.data.data;
        console.log('✅ 获取最终文章信息成功');
        console.log('   标题:', finalArticle.title);
        console.log('   状态:', finalArticle.status);
        console.log('   置顶:', finalArticle.isTop);
        console.log('   推荐:', finalArticle.isRecommend);
        console.log('   浏览量:', finalArticle.viewCount);

        console.log('\n🎉 文章页面功能测试完成！');
        console.log('\n📝 测试结果：');
        console.log('   - 文章创建：✅');
        console.log('   - 文章编辑：✅');
        console.log('   - 状态管理：✅');
        console.log('   - 置顶推荐：✅');
        console.log('   - 浏览量统计：✅');
        console.log('\n🌐 前端页面地址：');
        console.log(`   文章列表：http://localhost:5178/content/articles`);
        console.log(`   新建文章：http://localhost:5178/content/articles/new`);
        console.log(`   编辑文章：http://localhost:5178/content/articles/edit/${articleId}`);
        console.log(`   预览文章：http://localhost:5178/content/articles/preview/${articleId}`);

    } catch (error: any) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('错误详情:', error.response?.data || error);
    }
}

// 运行测试
testArticlePages(); 