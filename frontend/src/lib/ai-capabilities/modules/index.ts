/**
 * AI 模块能力注册
 * 
 * 这不是假工作流！这只是告诉系统每个模块有哪些快捷操作。
 * 真正的 AI 决策由后端 Agent Service 完成。
 */

import { registerModule } from '../registry';
import { Users } from 'lucide-react';

// ============ 客户管理模块 ============

registerModule({
    moduleId: 'clients',
    moduleName: '客户管理',
    description: '管理客户信息、联系人、合作历史等',
    icon: Users,
    availableTools: [
        'crm.create_client',
        'crm.search_client',
    ],
    quickActions: [
        {
            id: 'create-client',
            label: '新建客户',
            prompt: '帮我创建一个新客户',
            requiresConfirmation: true,
            order: 1,
        },
        {
            id: 'search-client',
            label: '搜索客户',
            prompt: '帮我搜索客户',
            order: 2,
        },
    ],
    routePatterns: [
        '/dashboard/clients',
        '/dashboard/clients/*',
    ],
    enabled: true,
});

// TODO: 添加更多模块...
// - 报价管理
// - 合同管理
// - 项目管理
// - 财务管理

