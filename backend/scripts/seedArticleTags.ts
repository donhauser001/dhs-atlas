import mongoose from 'mongoose'
import ArticleTag from '../src/models/ArticleTag'

const sampleTags = [
    {
        name: 'React',
        description: 'React相关技术文章',
        slug: 'react',
        color: '#61dafb',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'TypeScript',
        description: 'TypeScript开发技巧',
        slug: 'typescript',
        color: '#3178c6',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Node.js',
        description: 'Node.js后端开发',
        slug: 'nodejs',
        color: '#339933',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Vue',
        description: 'Vue.js前端框架',
        slug: 'vue',
        color: '#42b883',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'JavaScript',
        description: 'JavaScript编程语言',
        slug: 'javascript',
        color: '#f7df1e',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'MongoDB',
        description: 'MongoDB数据库',
        slug: 'mongodb',
        color: '#47a248',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'MySQL',
        description: 'MySQL数据库',
        slug: 'mysql',
        color: '#00758f',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Docker',
        description: 'Docker容器化技术',
        slug: 'docker',
        color: '#2496ed',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Git',
        description: 'Git版本控制',
        slug: 'git',
        color: '#f05032',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'API',
        description: 'API设计和开发',
        slug: 'api',
        color: '#1890ff',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'CSS',
        description: 'CSS样式设计',
        slug: 'css',
        color: '#1572b6',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'HTML',
        description: 'HTML标记语言',
        slug: 'html',
        color: '#e34f26',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Webpack',
        description: 'Webpack打包工具',
        slug: 'webpack',
        color: '#8dd6f9',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Express',
        description: 'Express.js框架',
        slug: 'express',
        color: '#000000',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Linux',
        description: 'Linux系统管理',
        slug: 'linux',
        color: '#fcc624',
        articleCount: 0,
        isActive: true,
        createTime: new Date(),
        updateTime: new Date()
    }
]

async function seedArticleTags() {
    try {
        // 连接数据库
        await mongoose.connect('mongodb://localhost:27017/donhauser')
        console.log('数据库连接成功')
        
        // 清空现有数据
        await ArticleTag.deleteMany({})
        console.log('已清空现有标签数据')
        
        // 插入标签数据
        await ArticleTag.insertMany(sampleTags)
        
        console.log('文章标签数据插入成功')
        
        // 查询验证
        const tags = await ArticleTag.find().sort({ createTime: 1 })
        console.log('插入的标签数据：')
        tags.forEach(tag => {
            console.log(`- ${tag.name} (${tag.slug})`)
        })
        
    } catch (error) {
        console.error('插入标签数据失败:', error)
    } finally {
        await mongoose.disconnect()
        console.log('数据库连接已关闭')
    }
}

seedArticleTags() 