import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 测试数据
const testArticle = {
    title: '测试文章标题',
    content: '这是一篇测试文章的内容，用于验证文章管理功能是否正常工作。',
    summary: '测试文章摘要',
    category: 'blog',
    tags: ['测试', '功能验证'],
    author: '测试用户',
    authorId: 'test-user-id',
    seoTitle: '测试文章SEO标题',
    seoKeywords: '测试,文章,功能',
    seoDescription: '这是一篇用于测试文章管理功能的文章'
};

async function testArticles() {
    console.log('🧪 开始测试文章管理功能...\n');

    try {
        // 1. 创建文章
        console.log('1. 测试创建文章...');
        const createResponse = await axios.post(`${API_BASE_URL}/articles`, testArticle);
        console.log('✅ 创建文章成功:', createResponse.data.message);
        const articleId = createResponse.data.data._id;
        console.log('   文章ID:', articleId);

        // 2. 获取文章列表
        console.log('\n2. 测试获取文章列表...');
        const listResponse = await axios.get(`${API_BASE_URL}/articles`);
        console.log('✅ 获取文章列表成功');
        console.log('   文章总数:', listResponse.data.total);
        console.log('   当前页文章数:', listResponse.data.data.length);

        // 3. 获取文章详情
        console.log('\n3. 测试获取文章详情...');
        const detailResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        console.log('✅ 获取文章详情成功');
        console.log('   文章标题:', detailResponse.data.data.title);

        // 4. 更新文章
        console.log('\n4. 测试更新文章...');
        const updateData = {
            title: '更新后的测试文章标题',
            content: '这是更新后的文章内容',
            status: 'published'
        };
        const updateResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}`, updateData);
        console.log('✅ 更新文章成功:', updateResponse.data.message);

        // 5. 测试置顶功能
        console.log('\n5. 测试置顶功能...');
        const topResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-top`);
        console.log('✅ 置顶功能测试成功:', topResponse.data.message);

        // 6. 测试推荐功能
        console.log('\n6. 测试推荐功能...');
        const recommendResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-recommend`);
        console.log('✅ 推荐功能测试成功:', recommendResponse.data.message);

        // 7. 测试增加浏览量
        console.log('\n7. 测试增加浏览量...');
        const viewResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}/increment-view`);
        console.log('✅ 增加浏览量成功:', viewResponse.data.message);

        // 8. 测试分类统计
        console.log('\n8. 测试分类统计...');
        const statsResponse = await axios.get(`${API_BASE_URL}/articles/stats/categories`);
        console.log('✅ 获取分类统计成功');
        console.log('   分类统计:', statsResponse.data.data);

        // 9. 测试热门文章
        console.log('\n9. 测试热门文章...');
        const popularResponse = await axios.get(`${API_BASE_URL}/articles/popular/list?limit=5`);
        console.log('✅ 获取热门文章成功');
        console.log('   热门文章数:', popularResponse.data.data.length);

        // 10. 测试推荐文章
        console.log('\n10. 测试推荐文章...');
        const recommendedResponse = await axios.get(`${API_BASE_URL}/articles/recommended/list?limit=5`);
        console.log('✅ 获取推荐文章成功');
        console.log('   推荐文章数:', recommendedResponse.data.data.length);

        // 11. 测试搜索功能
        console.log('\n11. 测试搜索功能...');
        const searchResponse = await axios.get(`${API_BASE_URL}/articles?search=测试`);
        console.log('✅ 搜索功能测试成功');
        console.log('   搜索结果数:', searchResponse.data.total);

        // 12. 测试分类筛选
        console.log('\n12. 测试分类筛选...');
        const categoryResponse = await axios.get(`${API_BASE_URL}/articles?category=blog`);
        console.log('✅ 分类筛选测试成功');
        console.log('   分类筛选结果数:', categoryResponse.data.total);

        // 13. 测试状态筛选
        console.log('\n13. 测试状态筛选...');
        const statusResponse = await axios.get(`${API_BASE_URL}/articles?status=published`);
        console.log('✅ 状态筛选测试成功');
        console.log('   状态筛选结果数:', statusResponse.data.total);

        // 14. 删除文章
        console.log('\n14. 测试删除文章...');
        const deleteResponse = await axios.delete(`${API_BASE_URL}/articles/${articleId}`);
        console.log('✅ 删除文章成功:', deleteResponse.data.message);

        console.log('\n🎉 所有文章管理功能测试通过！');

    } catch (error: any) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('错误详情:', error.response?.data || error);
    }
}

// 运行测试
testArticles(); 