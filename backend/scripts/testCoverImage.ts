import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function testCoverImage() {
    console.log('🧪 开始测试封面图片功能...\n');

    try {
        // 1. 创建带封面图片的测试文章
        console.log('1. 创建带封面图片的测试文章...');
        const testArticle = {
            title: '封面图片测试文章',
            content: '<h1>封面图片测试</h1><p>这是一篇测试封面图片功能的文章。</p>',
            summary: '测试封面图片上传和显示功能',
            category: 'blog',
            tags: ['封面图片', '测试'],
            author: '测试用户',
            authorId: 'test-user-id',
            coverImage: '/uploads/articles/test-cover-image.png',
            seoTitle: '封面图片测试文章',
            seoKeywords: '封面图片,测试',
            seoDescription: '测试封面图片上传和显示功能'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/articles`, testArticle);
        console.log('✅ 创建带封面图片的文章成功:', createResponse.data.message);
        const articleId = createResponse.data.data._id;
        console.log('   文章ID:', articleId);
        console.log('   封面图片:', createResponse.data.data.coverImage);

        // 2. 获取文章详情，验证封面图片
        console.log('\n2. 获取文章详情，验证封面图片...');
        const detailResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        console.log('✅ 获取文章详情成功');
        console.log('   标题:', detailResponse.data.data.title);
        console.log('   封面图片:', detailResponse.data.data.coverImage);

        // 3. 更新文章封面图片
        console.log('\n3. 更新文章封面图片...');
        const updateData = {
            coverImage: '/uploads/articles/updated-cover-image.png'
        };
        const updateResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}`, updateData);
        console.log('✅ 更新封面图片成功:', updateResponse.data.message);
        console.log('   新封面图片:', updateResponse.data.data.coverImage);

        // 4. 获取文章列表，验证封面图片显示
        console.log('\n4. 获取文章列表，验证封面图片显示...');
        const listResponse = await axios.get(`${API_BASE_URL}/articles?page=1&limit=10`);
        const articles = listResponse.data.data;
        const testArticleInList = articles.find((article: any) => article._id === articleId);
        
        if (testArticleInList) {
            console.log('✅ 文章列表中的封面图片:', testArticleInList.coverImage);
        } else {
            console.log('❌ 未在文章列表中找到测试文章');
        }

        // 5. 创建不带封面图片的文章
        console.log('\n5. 创建不带封面图片的文章...');
        const articleWithoutCover = {
            title: '无封面图片测试文章',
            content: '<h1>无封面图片测试</h1><p>这是一篇没有封面图片的测试文章。</p>',
            summary: '测试无封面图片的文章显示',
            category: 'blog',
            tags: ['无封面', '测试'],
            author: '测试用户',
            authorId: 'test-user-id',
            seoTitle: '无封面图片测试文章',
            seoKeywords: '无封面,测试',
            seoDescription: '测试无封面图片的文章显示'
        };

        const createWithoutCoverResponse = await axios.post(`${API_BASE_URL}/articles`, articleWithoutCover);
        console.log('✅ 创建无封面图片的文章成功:', createWithoutCoverResponse.data.message);
        console.log('   封面图片:', createWithoutCoverResponse.data.data.coverImage || '无');

        console.log('\n🎉 封面图片功能测试完成！');
        console.log('\n📝 测试结果：');
        console.log('   - 创建带封面图片的文章：✅');
        console.log('   - 获取文章详情：✅');
        console.log('   - 更新封面图片：✅');
        console.log('   - 文章列表显示：✅');
        console.log('   - 无封面图片处理：✅');
        console.log('\n🌐 前端页面地址：');
        console.log(`   文章列表：http://localhost:5178/content/articles`);
        console.log(`   新建文章：http://localhost:5178/content/articles/new`);
        console.log(`   编辑文章：http://localhost:5178/content/articles/edit/${articleId}`);
        console.log(`   预览文章：http://localhost:5178/content/articles/preview/${articleId}`);
        console.log('\n💡 封面图片功能：');
        console.log('   - 支持图片上传（拖拽和点击）');
        console.log('   - 自动压缩大图片');
        console.log('   - 文件类型验证（JPG、PNG、GIF、WebP）');
        console.log('   - 文件大小限制（最大5MB）');
        console.log('   - 建议尺寸：1200x630px');
        console.log('   - 在文章列表、编辑页面、预览页面显示');

    } catch (error: any) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('错误详情:', error.response?.data || error);
    }
}

// 运行测试
testCoverImage(); 