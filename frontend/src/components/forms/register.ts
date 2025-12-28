/**
 * 表单注册
 * 
 * 在这里注册所有的表单定义到表单注册表中。
 * 这个文件应该在应用启动时被导入。
 */

import { registerForm } from '@/lib/form-registry';
import { ClientForm } from './definitions/client-form';

// ============ 客户相关表单 ============

/**
 * 新建客户表单
 */
registerForm({
    id: 'client-create',
    title: '新建客户',
    description: '创建新的客户信息，包括客户名称、地址、发票信息、客户分类、评级等。',
    category: 'customer',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ClientForm as any,
    defaultValues: {
        name: '',
        address: '',
        category: '',
        invoiceType: '不开票',
        invoiceInfo: '',
        quotationId: '',
        rating: 3,
        summary: '',
        status: 'active',
    },
    supportedModes: ['create'],
    canvasEnabled: true,
    icon: 'users',
    triggers: ['新建客户', '添加客户', '创建客户', 'new client', 'add client'],
    fields: [
        { name: 'name', label: '客户名称', type: 'text', required: true },
        { name: 'address', label: '地址', type: 'textarea', required: true },
        { name: 'category', label: '客户分类', type: 'select', required: true },
        {
            name: 'invoiceType',
            label: '票种类别',
            type: 'select',
            required: true,
            options: [
                { label: '增值税专用发票', value: '增值税专用发票' },
                { label: '增值税普通发票', value: '增值税普通发票' },
                { label: '不开票', value: '不开票' },
            ]
        },
        { name: 'invoiceInfo', label: '开票信息', type: 'textarea', required: false },
        { name: 'quotationId', label: '报价单', type: 'select', required: false },
        { name: 'rating', label: '客户评级', type: 'rating', required: false },
        { name: 'summary', label: '客户摘要', type: 'textarea', required: false },
        {
            name: 'status',
            label: '状态',
            type: 'select',
            required: true,
            options: [
                { label: '启用', value: 'active' },
                { label: '禁用', value: 'inactive' },
            ]
        },
    ],
});

/**
 * 编辑客户表单
 */
registerForm({
    id: 'client-edit',
    title: '编辑客户',
    description: '修改现有客户的信息，包括客户名称、地址、发票信息、客户分类、评级等。',
    category: 'customer',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ClientForm as any,
    supportedModes: ['edit'],
    canvasEnabled: true,
    icon: 'user-pen',
    triggers: ['编辑客户', '修改客户', 'edit client', 'update client'],
    fields: [
        { name: 'name', label: '客户名称', type: 'text', required: true },
        { name: 'address', label: '地址', type: 'textarea', required: true },
        { name: 'category', label: '客户分类', type: 'select', required: true },
        {
            name: 'invoiceType',
            label: '票种类别',
            type: 'select',
            required: true,
            options: [
                { label: '增值税专用发票', value: '增值税专用发票' },
                { label: '增值税普通发票', value: '增值税普通发票' },
                { label: '不开票', value: '不开票' },
            ]
        },
        { name: 'invoiceInfo', label: '开票信息', type: 'textarea', required: false },
        { name: 'quotationId', label: '报价单', type: 'select', required: false },
        { name: 'rating', label: '客户评级', type: 'rating', required: false },
        { name: 'summary', label: '客户摘要', type: 'textarea', required: false },
        {
            name: 'status',
            label: '状态',
            type: 'select',
            required: true,
            options: [
                { label: '启用', value: 'active' },
                { label: '禁用', value: 'inactive' },
            ]
        },
    ],
});

/**
 * 查看客户表单
 */
registerForm({
    id: 'client-view',
    title: '客户详情',
    description: '查看客户的详细信息。',
    category: 'customer',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ClientForm as any,
    supportedModes: ['view'],
    canvasEnabled: true,
    icon: 'user',
    triggers: ['查看客户', '客户详情', 'view client', 'client details'],
    fields: [
        { name: 'name', label: '客户名称', type: 'text', required: true },
        { name: 'address', label: '地址', type: 'textarea', required: true },
        { name: 'category', label: '客户分类', type: 'select', required: true },
        { name: 'invoiceType', label: '票种类别', type: 'select', required: true },
        { name: 'invoiceInfo', label: '开票信息', type: 'textarea', required: false },
        { name: 'quotationId', label: '报价单', type: 'select', required: false },
        { name: 'rating', label: '客户评级', type: 'rating', required: false },
        { name: 'summary', label: '客户摘要', type: 'textarea', required: false },
        { name: 'status', label: '状态', type: 'select', required: true },
    ],
});

// ============ 日志输出 ============

if (process.env.NODE_ENV === 'development') {
    console.log('[FormRegistry] 客户表单已注册: client-create, client-edit, client-view');
}

