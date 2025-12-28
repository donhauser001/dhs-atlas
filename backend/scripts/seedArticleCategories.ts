import mongoose from 'mongoose'
import ArticleCategory from '../src/models/ArticleCategory'

const sampleCategories = [
    {
        name: '技术文章',
        description: '技术相关的文章分类',
        slug: 'tech',
        color: '#1890ff',
        articleCount: 0,
        isActive: true,
        level: 1,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: '前端开发',
        description: '前端技术相关文章',
        slug: 'frontend',
        color: '#52c41a',
        articleCount: 0,
        isActive: true,
        level: 2,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: '后端开发',
        description: '后端技术相关文章',
        slug: 'backend',
        color: '#722ed1',
        articleCount: 0,
        isActive: true,
        level: 2,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'React',
        description: 'React框架相关文章',
        slug: 'react',
        color: '#61dafb',
        articleCount: 0,
        isActive: true,
        level: 3,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Vue',
        description: 'Vue框架相关文章',
        slug: 'vue',
        color: '#42b883',
        articleCount: 0,
        isActive: true,
        level: 3,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'Node.js',
        description: 'Node.js相关文章',
        slug: 'nodejs',
        color: '#339933',
        articleCount: 0,
        isActive: true,
        level: 3,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: '数据库技术',
        description: '数据库相关文章',
        slug: 'database-tech',
        color: '#fa8c16',
        articleCount: 0,
        isActive: true,
        level: 2,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'MySQL',
        description: 'MySQL数据库文章',
        slug: 'mysql',
        color: '#00758f',
        articleCount: 0,
        isActive: true,
        level: 3,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: 'MongoDB',
        description: 'MongoDB数据库文章',
        slug: 'mongodb',
        color: '#47a248',
        articleCount: 0,
        isActive: true,
        level: 3,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    },
    {
        name: '运维部署',
        description: '运维和部署相关文章',
        slug: 'devops',
        color: '#f5222d',
        articleCount: 0,
        isActive: true,
        level: 2,
        path: [],
        createTime: new Date(),
        updateTime: new Date()
    }
]

async function seedArticleCategories() {
    try {
        // 连接数据库
        await mongoose.connect('mongodb://localhost:27017/donhauser')
        console.log('数据库连接成功')
        
        // 清空现有数据
        await ArticleCategory.deleteMany({})
        console.log('已清空现有分类数据')
        
        // 插入一级分类
        const techCategory = await ArticleCategory.create(sampleCategories[0])
        const devopsCategory = await ArticleCategory.create(sampleCategories[9])
        
        // 插入二级分类
        const frontendCategory = await ArticleCategory.create({
            ...sampleCategories[1],
            parentId: techCategory._id,
            path: [techCategory._id]
        })
        
        const backendCategory = await ArticleCategory.create({
            ...sampleCategories[2],
            parentId: techCategory._id,
            path: [techCategory._id]
        })
        
        const dbCategory = await ArticleCategory.create({
            ...sampleCategories[6],
            parentId: techCategory._id,
            path: [techCategory._id]
        })
        
        // 插入三级分类
        await ArticleCategory.create({
            ...sampleCategories[3],
            parentId: frontendCategory._id,
            path: [techCategory._id, frontendCategory._id]
        })
        
        await ArticleCategory.create({
            ...sampleCategories[4],
            parentId: frontendCategory._id,
            path: [techCategory._id, frontendCategory._id]
        })
        
        await ArticleCategory.create({
            ...sampleCategories[5],
            parentId: backendCategory._id,
            path: [techCategory._id, backendCategory._id]
        })
        
        await ArticleCategory.create({
            ...sampleCategories[7],
            parentId: dbCategory._id,
            path: [techCategory._id, dbCategory._id]
        })
        
        await ArticleCategory.create({
            ...sampleCategories[8],
            parentId: dbCategory._id,
            path: [techCategory._id, dbCategory._id]
        })
        
        console.log('文章分类数据插入成功')
        
        // 查询验证
        const categories = await ArticleCategory.find().sort({ level: 1, createTime: 1 })
        console.log('插入的分类数据：')
        categories.forEach(cat => {
            console.log(`- ${cat.name} (${cat.slug}) - 层级: ${cat.level}`)
        })
        
    } catch (error) {
        console.error('插入分类数据失败:', error)
    } finally {
        await mongoose.disconnect()
        console.log('数据库连接已关闭')
    }
}

seedArticleCategories() 