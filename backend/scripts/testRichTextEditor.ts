import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function testRichTextEditor() {
    console.log('🧪 开始测试富文本编辑器功能...\n');

    try {
        // 1. 创建包含富文本内容的测试文章
        console.log('1. 创建包含富文本内容的测试文章...');
        const richTextContent = `
            <h1>富文本编辑器测试文章</h1>
            <p>这是一篇使用富文本编辑器创建的测试文章，包含多种格式。</p>
            
            <h2>功能特点</h2>
            <ul>
                <li><strong>文本格式化</strong>：支持粗体、斜体、下划线等</li>
                <li><em>列表功能</em>：支持有序列表和无序列表</li>
                <li><span style="color: #1890ff;">颜色设置</span>：支持文字颜色和背景色</li>
                <li>对齐方式：支持左对齐、居中、右对齐、两端对齐</li>
            </ul>
            
            <h2>高级功能</h2>
            <ol>
                <li>图片上传：支持拖拽上传和点击上传</li>
                <li>链接插入：可以插入外部链接</li>
                <li>表格创建：支持创建和编辑表格</li>
                <li>代码块：支持多种编程语言的代码高亮</li>
            </ol>
            
            <h3>代码示例</h3>
            <pre><code class="language-javascript">
function helloWorld() {
    console.log("Hello, Rich Text Editor!");
    return "富文本编辑器功能强大！";
}
            </code></pre>
            
            <h3>表格示例</h3>
            <table border="1" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd;">功能</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">状态</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">说明</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">文本编辑</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: green;">✅</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">基础文本编辑功能</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">图片上传</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: green;">✅</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">支持图片上传和压缩</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">表格编辑</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: green;">✅</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">支持表格创建和编辑</td>
                    </tr>
                </tbody>
            </table>
            
            <blockquote style="border-left: 4px solid #1890ff; padding-left: 16px; margin: 16px 0; color: #666;">
                富文本编辑器提供了丰富的编辑功能，让文章创作更加便捷和高效。
            </blockquote>
            
            <p>更多功能请访问：<a href="https://www.wangeditor.com/" target="_blank">wangEditor 官网</a></p>
        `;

        const testArticle = {
            title: '富文本编辑器功能测试',
            content: richTextContent,
            summary: '测试富文本编辑器的各种功能，包括文本格式化、图片上传、表格编辑等',
            category: 'tutorial',
            tags: ['富文本编辑器', 'wangEditor', '功能测试'],
            author: '测试用户',
            authorId: 'test-user-id',
            seoTitle: '富文本编辑器功能测试',
            seoKeywords: '富文本编辑器,wangEditor,功能测试',
            seoDescription: '测试富文本编辑器的各种功能，包括文本格式化、图片上传、表格编辑等'
        };

        const createResponse = await axios.post(`${API_BASE_URL}/articles`, testArticle);
        console.log('✅ 创建富文本测试文章成功:', createResponse.data.message);
        const articleId = createResponse.data.data._id;
        console.log('   文章ID:', articleId);

        // 2. 获取文章详情
        console.log('\n2. 获取富文本文章详情...');
        const detailResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        console.log('✅ 获取富文本文章详情成功');
        console.log('   文章标题:', detailResponse.data.data.title);
        console.log('   内容长度:', detailResponse.data.data.content.length);

        // 3. 更新文章内容
        console.log('\n3. 更新富文本文章内容...');
        const updatedContent = detailResponse.data.data.content + `
            <h2>更新内容</h2>
            <p>这是通过富文本编辑器更新的内容，包含 <span style="background-color: #ffeb3b;">高亮文本</span> 和 <span style="color: #f44336;">红色文字</span>。</p>
            
            <h3>新增功能列表</h3>
            <ul>
                <li>✅ 富文本编辑</li>
                <li>✅ 图片上传</li>
                <li>✅ 表格编辑</li>
                <li>✅ 代码高亮</li>
                <li>✅ 链接管理</li>
            </ul>
        `;

        const updateData = {
            content: updatedContent,
            status: 'published'
        };
        const updateResponse = await axios.put(`${API_BASE_URL}/articles/${articleId}`, updateData);
        console.log('✅ 更新富文本文章成功:', updateResponse.data.message);

        // 4. 设置文章属性
        console.log('\n4. 设置文章属性...');
        await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-top`);
        await axios.put(`${API_BASE_URL}/articles/${articleId}/toggle-recommend`);
        console.log('✅ 设置置顶和推荐成功');

        // 5. 获取最终文章信息
        console.log('\n5. 获取最终文章信息...');
        const finalResponse = await axios.get(`${API_BASE_URL}/articles/${articleId}`);
        const finalArticle = finalResponse.data.data;
        console.log('✅ 获取最终文章信息成功');
        console.log('   标题:', finalArticle.title);
        console.log('   状态:', finalArticle.status);
        console.log('   置顶:', finalArticle.isTop);
        console.log('   推荐:', finalArticle.isRecommend);
        console.log('   内容长度:', finalArticle.content.length);

        console.log('\n🎉 富文本编辑器功能测试完成！');
        console.log('\n📝 测试结果：');
        console.log('   - 富文本内容创建：✅');
        console.log('   - HTML内容存储：✅');
        console.log('   - 内容更新：✅');
        console.log('   - 文章属性设置：✅');
        console.log('\n🌐 前端页面地址：');
        console.log(`   文章列表：http://localhost:5178/content/articles`);
        console.log(`   新建文章：http://localhost:5178/content/articles/new`);
        console.log(`   编辑文章：http://localhost:5178/content/articles/edit/${articleId}`);
        console.log(`   预览文章：http://localhost:5178/content/articles/preview/${articleId}`);
        console.log('\n💡 富文本编辑器功能：');
        console.log('   - 文本格式化（粗体、斜体、下划线等）');
        console.log('   - 颜色设置（文字颜色、背景色）');
        console.log('   - 对齐方式（左对齐、居中、右对齐、两端对齐）');
        console.log('   - 列表功能（有序列表、无序列表）');
        console.log('   - 图片上传（支持拖拽和点击上传）');
        console.log('   - 链接插入（支持外部链接）');
        console.log('   - 表格编辑（创建和编辑表格）');
        console.log('   - 代码块（支持多种编程语言）');
        console.log('   - 引用块（支持引用样式）');

    } catch (error: any) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('错误详情:', error.response?.data || error);
    }
}

// 运行测试
testRichTextEditor(); 