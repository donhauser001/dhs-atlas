import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { WebSocketService } from './services/WebSocketService';
import { TaskSchedulerService } from './services/TaskSchedulerService';

// 导入路由
import userRoutes from './routes/users';
import enterpriseRoutes from './routes/enterprises';
import departmentRoutes from './routes/departments';
import permissionRoutes from './routes/permissions';
import roleRoutes from './routes/roles';
import uploadRoutes from './routes/upload';
import clientRoutes from './routes/clients';
import clientCategoryRoutes from './routes/clientCategories';
import pricingCategoryRoutes from './routes/pricingCategories';
import serviceProcessRoutes from './routes/serviceProcesses';
import additionalConfigRoutes from './routes/additionalConfigs';
import pricingPolicyRoutes from './routes/pricingPolicies';
import servicePricingRoutes from './routes/servicePricing';
import quotationRoutes from './routes/quotations';
import contractTemplateRoutes from './routes/contractTemplates';
import contractTemplateCategoryRoutes from './routes/contractTemplateCategories';
import generatedContractRoutes from './routes/generatedContracts';
import specificationRoutes from './routes/specifications';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import settlementRoutes from './routes/settlements';
import incomeRoutes from './routes/incomes';
import invoiceRoutes from './routes/invoices';
import articleRoutes from './routes/articles';
import articleCategoryRoutes from './routes/articleCategories';
import articleTagRoutes from './routes/articleTags';
import formCategoryRoutes from './routes/formCategories';
import formRoutes from './routes/forms';
import fileCenterRoutes from './routes/fileCenter';

import emailSettingRoutes from './routes/emailSettings';
import messageRoutes from './routes/messages';
import messageTemplateRoutes from './routes/messageTemplates';
import messageSubscriptionRoutes from './routes/messageSubscriptions';
import messageVariableRoutes from './routes/messageVariables';
import templateWizardRoutes from './routes/templateWizard';
import websocketRoutes from './routes/websocket';
import authRoutes from './routes/auth';
import devToolsRoutes from './routes/devTools';
import clientPortalRoutes from './routes/clientPortal';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 创建HTTP服务器
const httpServer = createServer(app);

// 初始化WebSocket服务和任务调度服务
let webSocketService: WebSocketService;
let taskSchedulerService: TaskSchedulerService;

// 连接MongoDB数据库
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB数据库连接成功');
    console.log(`🔗 连接地址: ${mongoUri}`);
  } catch (error) {
    console.error('❌ MongoDB数据库连接失败:', error);
    process.exit(1);
  }
};

// 启动数据库连接
connectDB().then(() => {
  // 数据库连接成功后初始化WebSocket服务和任务调度服务
  webSocketService = new WebSocketService(httpServer);

  // 初始化并启动任务调度服务
  taskSchedulerService = new TaskSchedulerService();
  taskSchedulerService.start();
});

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 为每个业务板块提供文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // 设置图片文件的缓存和CORS头
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年缓存
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '设计业务管理系统 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      enterprises: '/api/enterprises',
      departments: '/api/departments',
      permissions: '/api/permissions',
      roles: '/api/roles',
      clients: '/api/clients',
      clientCategories: '/api/client-categories',
      pricingCategories: '/api/pricing-categories',
      serviceProcesses: '/api/service-processes',
      additionalConfigs: '/api/additional-configs',
      pricingPolicies: '/api/pricing-policies',
      servicePricing: '/api/service-pricing',
      quotations: '/api/quotations',
      contractTemplates: '/api/contract-templates',
      generatedContracts: '/api/generated-contracts',
      specifications: '/api/specifications',
      projects: '/api/projects',
      tasks: '/api/tasks',
      settlements: '/api/settlements',
      incomes: '/api/incomes',
      invoices: '/api/invoices',
      articles: '/api/articles',
      articleCategories: '/api/article-categories',
      articleTags: '/api/article-tags',
      formCategories: '/api/form-categories',
      forms: '/api/forms'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-categories', clientCategoryRoutes);
app.use('/api/pricing-categories', pricingCategoryRoutes);
app.use('/api/service-processes', serviceProcessRoutes);
app.use('/api/additional-configs', additionalConfigRoutes);
app.use('/api/pricing-policies', pricingPolicyRoutes);
app.use('/api/service-pricing', servicePricingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/contract-template-categories', contractTemplateCategoryRoutes);
app.use('/api/generated-contracts', generatedContractRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/article-categories', articleCategoryRoutes);
app.use('/api/article-tags', articleTagRoutes);
app.use('/api/form-categories', formCategoryRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/file-center', fileCenterRoutes);

app.use('/api/email-settings', emailSettingRoutes);

// 消息管理路由
app.use('/api/messages', messageRoutes);
app.use('/api/message-templates', messageTemplateRoutes);
app.use('/api/message-subscriptions', messageSubscriptionRoutes);
app.use('/api/message-variables', messageVariableRoutes);
app.use('/api/template-wizard', templateWizardRoutes);

// WebSocket管理路由
app.use('/api/websocket', websocketRoutes);

// 开发工具路由（临时）
app.use('/api/dev-tools', devToolsRoutes);

// 客户门户路由
app.use('/api/client-portal', clientPortalRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动HTTP服务器（包含WebSocket）
httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket服务已启用`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`👥 用户管理: http://localhost:${PORT}/api/users`);
  console.log(`🏢 企业管理: http://localhost:${PORT}/api/enterprises`);
  console.log(`🏛️ 部门管理: http://localhost:${PORT}/api/departments`);
  console.log(`🔐 权限管理: http://localhost:${PORT}/api/permissions`);
  console.log(`🎭 角色管理: http://localhost:${PORT}/api/roles`);
  console.log(`👥 客户管理: http://localhost:${PORT}/api/clients`);
  console.log(`📂 客户分类: http://localhost:${PORT}/api/client-categories`);
  console.log(`💰 定价分类: http://localhost:${PORT}/api/pricing-categories`);
  console.log(`🔄 服务流程: http://localhost:${PORT}/api/service-processes`);
  console.log(`📨 消息管理: http://localhost:${PORT}/api/messages`);
});

// 导出WebSocket服务实例
export const getWebSocketService = (): WebSocketService => webSocketService;

export default app;