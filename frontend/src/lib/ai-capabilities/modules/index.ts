/**
 * AI 模块能力注册
 * 
 * 这不是假工作流！这只是告诉系统每个模块有哪些快捷操作。
 * 真正的 AI 决策由后端 Agent Service 完成。
 * 
 * 优化记录（Phase 1 检测后）:
 * - 2024-12-30: 添加 contracts、projects、settings 模块注册
 *   解决 currentModule 为 unknown 的问题
 */

import { registerModule } from '../registry';
import { Users, FileText, FolderKanban, Settings, LayoutDashboard } from 'lucide-react';

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

// ============ 合同管理模块 ============

registerModule({
    moduleId: 'contracts',
    moduleName: '合同管理',
    description: '管理合同、合同范本、合同生成等',
    icon: FileText,
    availableTools: [
        'contract.generate',
        'contract.query',
        'contract.list_templates',
    ],
    quickActions: [
        {
            id: 'generate-contract',
            label: '生成合同',
            prompt: '帮我生成一份合同',
            requiresConfirmation: true,
            order: 1,
        },
        {
            id: 'query-contracts',
            label: '查询合同',
            prompt: '帮我查询合同',
            order: 2,
        },
        {
            id: 'list-templates',
            label: '查看合同范本',
            prompt: '帮我查看合同范本列表',
            order: 3,
        },
    ],
    routePatterns: [
        '/dashboard/contracts',
        '/dashboard/contracts/*',
    ],
    enabled: true,
});

// ============ 项目管理模块 ============

registerModule({
    moduleId: 'projects',
    moduleName: '项目管理',
    description: '管理项目信息、项目进度、项目统计等',
    icon: FolderKanban,
    availableTools: [
        'project.query',
        'project.stats',
    ],
    quickActions: [
        {
            id: 'query-projects',
            label: '查询项目',
            prompt: '帮我查询项目',
            order: 1,
        },
        {
            id: 'project-stats',
            label: '项目统计',
            prompt: '帮我统计项目金额',
            order: 2,
        },
    ],
    routePatterns: [
        '/dashboard/projects',
        '/dashboard/projects/*',
    ],
    enabled: true,
});

// ============ 设置模块 ============

registerModule({
    moduleId: 'settings',
    moduleName: '系统设置',
    description: 'AI 配置、系统设置等',
    icon: Settings,
    availableTools: [],
    quickActions: [],
    routePatterns: [
        '/dashboard/settings',
        '/dashboard/settings/*',
    ],
    enabled: true,
});

// ============ 仪表盘模块 ============

registerModule({
    moduleId: 'dashboard',
    moduleName: '工作台',
    description: '概览、统计、快捷入口等',
    icon: LayoutDashboard,
    availableTools: [],
    quickActions: [
        {
            id: 'today-summary',
            label: '今日概览',
            prompt: '帮我看看今天有什么待办',
            order: 1,
        },
    ],
    routePatterns: [
        '/dashboard',
    ],
    enabled: true,
});

