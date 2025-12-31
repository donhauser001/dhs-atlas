/**
 * 升级 AI 地图到 V2 架构
 * 
 * V2 核心变化：
 * - 每步必须有 name（步骤名称）
 * - 每步必须有 toolId（除非是纯提示步骤）
 * - 添加 paramsTemplate（参数模板）
 * - 添加 outputKey（输出变量名）
 * - 添加 nextStepPrompt（下一步提示词）- 核心！
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser';

// V2 格式的地图数据
const v2Maps = [
  // ============================================
  // 1. query_client - 查询客户
  // ============================================
  {
    mapId: 'query_client',
    name: '查询客户',
    description: '根据客户名称或条件查询客户信息',
    triggers: ['查询', '查一下', '找一下', '搜索', '查找', '信息', '资料', '详情'],
    module: 'crm',
    priority: 10,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '查询客户信息',
        action: '使用 crm.client_detail 工具查询客户详情',
        toolId: 'crm.client_detail',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}'
        },
        outputKey: 'clientInfo',
        nextStepPrompt: `✅ 步骤1完成。已获取客户信息。
📋 请将客户信息用 Markdown 表格展示给用户，包括：
- 客户名称、地址、分类、评级
- 开票信息
- 备注信息`,
        dataModel: 'clients',
        note: '使用专用工具查询，自动处理模糊匹配'
      }
    ],
    examples: `**用户**: 查一下中信出版社的信息
**AI**: 调用 crm.client_detail 查询客户

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.client_detail", "params": {"clientName": "中信出版社"}}
\`\`\`

**输出**: 用 Markdown 表格展示客户详情`
  },

  // ============================================
  // 2. create_client - 新建客户
  // ============================================
  {
    mapId: 'create_client',
    name: '新建客户',
    description: '创建新客户，打开表单并协助填写',
    triggers: ['新建客户', '创建客户', '添加客户', '录入客户'],
    module: 'crm',
    priority: 10,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '检查客户是否存在',
        action: '先查询是否已存在同名客户',
        toolId: 'crm.client_detail',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}'
        },
        outputKey: 'existingClient',
        nextStepPrompt: `✅ 步骤1完成。
{{#if existingClient.client}}
⚠️ 发现同名客户已存在！请告知用户，并询问是否要查看该客户详情或使用其他名称。
{{else}}
📍 下一步：请打开新建客户表单。
\`\`\`ui_form
{"formId": "client-create", "mode": "create", "initialData": {"name": "{{用户提供的客户名称}}"}}
\`\`\`
{{/if}}`,
        note: '避免重复创建'
      },
      {
        order: 2,
        name: '打开新建表单',
        action: '打开新建客户表单',
        toolId: 'ui.form',
        paramsTemplate: {
          formId: 'client-create',
          mode: 'create',
          initialData: { name: '{{用户提供的客户名称}}' }
        },
        note: '将已知信息预填到表单',
        condition: '客户不存在时'
      }
    ],
    examples: `**用户**: 帮我新建一个客户，叫中信出版社

**步骤1**: 检查是否存在
\`\`\`tool_call
{"toolId": "crm.client_detail", "params": {"clientName": "中信出版社"}}
\`\`\`

**步骤2**（如果不存在）: 打开表单
\`\`\`ui_form
{"formId": "client-create", "mode": "create", "initialData": {"name": "中信出版社"}}
\`\`\``
  },

  // ============================================
  // 3. query_client_projects - 查询客户项目
  // ============================================
  {
    mapId: 'query_client_projects',
    name: '查询客户项目',
    description: '查询指定客户的关联项目',
    triggers: ['客户的项目', '关联项目', '查项目', '有哪些项目'],
    module: 'crm',
    priority: 5,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '查询客户项目列表',
        action: '使用 crm.client_projects 工具查询客户的项目',
        toolId: 'crm.client_projects',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}'
        },
        outputKey: 'projectList',
        nextStepPrompt: `✅ 步骤1完成。
📋 找到 {{projectList.projectCount}} 个项目。
请用 Markdown 表格展示：项目名称、状态、联系人、创建时间`,
        dataModel: 'projects',
        note: '使用专用工具，自动按客户名称查询'
      }
    ],
    examples: `**用户**: 查一下中信出版社有哪些项目

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.client_projects", "params": {"clientName": "中信出版社"}}
\`\`\`

**输出**: Markdown 表格展示项目列表`
  },

  // ============================================
  // 4. query_contact_stats - 联系人项目统计
  // ============================================
  {
    mapId: 'query_contact_stats',
    name: '联系人项目统计',
    description: '统计某客户下各联系人的项目数量，找出项目最多的联系人',
    triggers: ['哪些联系人', '哪个人', '谁的项目', '项目最多'],
    module: 'crm',
    priority: 8,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '获取联系人项目统计',
        action: '使用 crm.contact_stats 工具获取聚合好的统计数据',
        toolId: 'crm.contact_stats',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}',
          includeAmount: false
        },
        outputKey: 'contactStats',
        nextStepPrompt: `✅ 步骤1完成。已获取统计数据。
📋 请用 Markdown 表格展示：
| 联系人 | 项目数量 | 项目列表 |
并在最后总结：项目最多的是谁`,
        note: '该工具会自动聚合统计，返回真实数据'
      }
    ],
    examples: `**用户**: 中信出版社有哪些联系人，哪个人项目最多

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社"}}
\`\`\`

**输出**: 直接使用工具返回的数据填充表格，不要编造任何数据！`
  },

  // ============================================
  // 5. query_project_amount - 项目金额统计
  // ============================================
  {
    mapId: 'query_project_amount',
    name: '项目金额统计',
    description: '统计某客户的项目金额，找出金额最高的联系人',
    triggers: ['金额最高', '金额统计', '多少钱', '结算'],
    module: 'crm',
    priority: 7,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '获取金额统计',
        action: '使用 crm.contact_stats 工具并开启金额统计',
        toolId: 'crm.contact_stats',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}',
          includeAmount: true
        },
        outputKey: 'amountStats',
        nextStepPrompt: `✅ 步骤1完成。已获取金额统计数据。
📋 请用 Markdown 表格展示：
| 联系人 | 项目数 | 总金额 | 项目列表 |
并在最后总结：金额最高的是谁，总金额多少`,
        note: '设置 includeAmount: true 获取金额数据'
      }
    ],
    examples: `**用户**: 中信出版社哪个联系人给我们的项目金额最高

**工具调用**:
\`\`\`tool_call
{"toolId": "crm.contact_stats", "params": {"clientName": "中信出版社", "includeAmount": true}}
\`\`\`

**输出**: 直接使用工具返回的数据，不要编造！`
  },

  // ============================================
  // 6. generate_contract - 生成合同（多步骤）
  // ============================================
  {
    mapId: 'generate_contract',
    name: '生成合同',
    description: 'AI 原生合同生成流程：根据用户需求智能匹配范本，收集必要信息，生成完整合同',
    triggers: ['生成合同', '新建合同', '创建合同', '出合同', '拟合同', '写合同', '做合同', '签合同', '帮我生成', '生成一份', '起草合同', '草拟合同', '合同生成', '要一份合同', '需要合同', '一份合同', '制作合同'],
    module: 'contract',
    priority: 10,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '获取合同范本列表',
        action: '获取可用的合同范本列表',
        toolId: 'contract.template.list',
        paramsTemplate: {
          status: 'active'
        },
        outputKey: 'templateList',
        nextStepPrompt: `✅ 步骤1完成。获取到 {{templateList.length}} 个可用范本。
📍 下一步：请根据用户描述，调用 contract.template.match 匹配最合适的范本。
\`\`\`tool_call
{"toolId": "contract.template.match", "params": {"description": "{{用户的合同需求描述}}"}}
\`\`\``,
        note: '获取所有启用状态的范本'
      },
      {
        order: 2,
        name: '智能匹配范本',
        action: '根据用户描述智能匹配最合适的范本',
        toolId: 'contract.template.match',
        paramsTemplate: {
          description: '{{用户的合同需求描述}}'
        },
        outputKey: 'matchedTemplate',
        nextStepPrompt: `✅ 步骤2完成。已匹配到合适的范本。
📍 下一步：请分析该范本需要填充哪些数据。
\`\`\`tool_call
{"toolId": "contract.template.analyze", "params": {"templateId": "{{matchedTemplate[0]._id}}"}}
\`\`\``,
        note: '分析用户需求，匹配最佳范本'
      },
      {
        order: 3,
        name: '分析范本数据需求',
        action: '分析所选范本需要填充的数据',
        toolId: 'contract.template.analyze',
        paramsTemplate: {
          templateId: '{{matchedTemplate[0]._id}}'
        },
        outputKey: 'templateAnalysis',
        nextStepPrompt: `✅ 步骤3完成。范本分析完成，需要填充以下占位符：
{{#each templateAnalysis.placeholders}}
- {{this.name}}: {{this.description}}
{{/each}}

📍 下一步：
1. 如果用户已提供客户名称，请用 crm.client_detail 获取客户信息
2. 向用户询问缺少的必要信息（如金额、期限等）
3. 收集完成后，调用 contract.generate 生成合同`,
        note: '获取所有占位符及其描述'
      },
      {
        order: 4,
        name: '收集合同数据',
        action: '收集合同所需数据',
        toolId: 'crm.client_detail',
        paramsTemplate: {
          clientName: '{{用户提供的客户名称}}'
        },
        outputKey: 'clientData',
        nextStepPrompt: `✅ 步骤4完成。已获取客户数据。
📍 下一步：请确认所有必要数据已收集，然后生成合同。
\`\`\`tool_call
{"toolId": "contract.generate", "params": {"templateId": "{{matchedTemplate[0]._id}}", "data": {"甲方名称": "{{clientData.client.name}}", ...其他字段}}}
\`\`\``,
        note: '如果用户提供了客户名称，获取客户信息',
        condition: '用户提供了客户名称时'
      },
      {
        order: 5,
        name: '生成合同内容',
        action: '生成合同内容',
        toolId: 'contract.generate',
        paramsTemplate: {
          templateId: '{{matchedTemplate[0]._id}}',
          data: '{{收集到的所有数据}}'
        },
        outputKey: 'generatedContract',
        nextStepPrompt: `✅ 步骤5完成。合同内容已生成！

📄 **合同预览**：
{{generatedContract.content}}

---
请检查以上内容是否正确。如果确认无误，请说"确认保存"，我将为您保存合同。`,
        note: '将收集的数据填充到范本中'
      },
      {
        order: 6,
        name: '保存合同',
        action: '保存合同到数据库',
        toolId: 'contract.save',
        paramsTemplate: {
          templateId: '{{matchedTemplate[0]._id}}',
          name: '{{合同名称}}',
          content: '{{generatedContract.content}}',
          clientId: '{{clientData.client._id}}'
        },
        outputKey: 'savedContract',
        nextStepPrompt: `✅ 合同已保存！
合同编号：{{savedContract._id}}
您可以在合同管理中查看和导出。`,
        note: '需要用户确认后才执行',
        condition: '用户确认保存时'
      }
    ],
    examples: `**用户**: 我要生成一份翻译服务合同，客户是中信出版社

**步骤1**: 获取范本列表
**步骤2**: 匹配翻译相关范本
**步骤3**: 分析范本需要的数据
**步骤4**: 获取中信出版社信息
**步骤5**: 收集其他信息并生成合同
**步骤6**: 用户确认后保存`
  },

  // ============================================
  // 7. query_contracts - 查询合同
  // ============================================
  {
    mapId: 'query_contracts',
    name: '查询合同',
    description: '查询合同列表或合同详情',
    triggers: ['查合同', '查看合同', '合同列表', '找合同', '哪些合同', '合同情况', '查询合同', '所有合同', '合同记录', '已签合同', '合同信息'],
    module: 'contract',
    priority: 8,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '查询合同列表',
        action: '使用 contract.list 查询合同列表',
        toolId: 'contract.list',
        paramsTemplate: {
          limit: 20,
          keyword: '{{用户提供的关键词}}',
          status: '{{用户指定的状态}}'
        },
        outputKey: 'contractList',
        nextStepPrompt: `✅ 步骤1完成。
📋 找到 {{contractList.length}} 份合同。
请用 Markdown 表格展示：合同名称、编号、状态、客户、创建时间

如果用户想看某份合同的详情，可以调用：
\`\`\`tool_call
{"toolId": "contract.get", "params": {"contractId": "合同ID"}}
\`\`\``,
        note: '根据用户条件筛选'
      },
      {
        order: 2,
        name: '获取合同详情',
        action: '如果用户想看详情，使用 contract.get 获取',
        toolId: 'contract.get',
        paramsTemplate: {
          contractId: '{{用户指定的合同ID}}'
        },
        outputKey: 'contractDetail',
        nextStepPrompt: `✅ 步骤2完成。
📄 合同详情已获取，请展示完整信息。`,
        condition: '用户指定了具体合同时'
      }
    ],
    examples: `**用户**: 查一下最近的合同
\`\`\`tool_call
{"toolId": "contract.list", "params": {"limit": 10}}
\`\`\`

**用户**: 查一下中信出版社的合同
\`\`\`tool_call
{"toolId": "contract.list", "params": {"keyword": "中信出版社"}}
\`\`\``
  },

  // ============================================
  // 8. list_templates - 查看合同范本
  // ============================================
  {
    mapId: 'list_templates',
    name: '查看合同范本',
    description: '查看可用的合同范本列表',
    triggers: ['合同范本', '范本列表', '有哪些范本', '合同模板', '模板列表', '范本类型', '查看范本', '看看范本', '可用范本', '范本目录'],
    module: 'contract',
    priority: 6,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '获取范本列表',
        action: '使用 contract.template.list 获取范本列表',
        toolId: 'contract.template.list',
        paramsTemplate: {
          status: 'active'
        },
        outputKey: 'templateList',
        nextStepPrompt: `✅ 步骤1完成。
📋 共有 {{templateList.length}} 个可用范本。
请用 Markdown 表格展示：范本名称、分类、是否默认`,
        note: '获取启用状态的范本'
      }
    ],
    examples: `**用户**: 我们有哪些合同范本
\`\`\`tool_call
{"toolId": "contract.template.list", "params": {"status": "active"}}
\`\`\``
  },

  // ============================================
  // 9. finance_overview - 财务概览
  // ============================================
  {
    mapId: 'finance_overview',
    name: '财务概览',
    description: '查看财务汇总：结算单、收款、待收款等统计',
    triggers: ['财务概览', '财务汇总', '收入统计', '结算统计', '待收款'],
    module: 'finance',
    priority: 7,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '查询结算单',
        action: '查询结算单列表',
        toolId: 'finance.settlements',
        paramsTemplate: {
          limit: 50
        },
        outputKey: 'settlements',
        nextStepPrompt: `✅ 步骤1完成。获取到 {{settlements.length}} 条结算单。
📍 下一步：查询收款记录。
\`\`\`tool_call
{"toolId": "finance.incomes", "params": {"limit": 50}}
\`\`\``,
        dataModel: 'settlements'
      },
      {
        order: 2,
        name: '查询收款记录',
        action: '查询收款记录',
        toolId: 'finance.incomes',
        paramsTemplate: {
          limit: 50
        },
        outputKey: 'incomes',
        nextStepPrompt: `✅ 步骤2完成。获取到 {{incomes.length}} 条收款记录。
📋 请计算并展示财务汇总：
- 总结算金额
- 已收款金额
- 待收款金额（= 总结算 - 已收款）

用 Markdown 表格分别展示近期结算单和收款记录。`,
        dataModel: 'incomes'
      }
    ],
    examples: `**用户**: 查看财务汇总

**步骤1**: 查询结算单
**步骤2**: 查询收款记录
**步骤3**: 计算汇总（总结算金额 - 已收款 = 待收款）`
  },

  // ============================================
  // 10. project_overview - 项目概览
  // ============================================
  {
    mapId: 'project_overview',
    name: '项目概览',
    description: '查看项目整体情况：项目列表、状态统计',
    triggers: ['项目概览', '项目统计', '有多少项目', '项目情况'],
    module: 'project',
    priority: 7,
    enabled: true,
    steps: [
      {
        order: 1,
        name: '统计项目状态',
        action: '统计项目状态分布',
        toolId: 'project.stats',
        paramsTemplate: {},
        outputKey: 'projectStats',
        nextStepPrompt: `✅ 步骤1完成。已获取项目状态统计。
📍 下一步：获取最近的项目列表。
\`\`\`tool_call
{"toolId": "project.list", "params": {"limit": 10}}
\`\`\``,
        dataModel: 'projects'
      },
      {
        order: 2,
        name: '获取项目列表',
        action: '查询最近的项目列表',
        toolId: 'project.list',
        paramsTemplate: {
          limit: 10
        },
        outputKey: 'projectList',
        nextStepPrompt: `✅ 步骤2完成。
📋 请展示项目概览：

**状态统计**
| 状态 | 数量 |
（根据 projectStats 填充）

**最近项目**
| 项目名称 | 客户 | 状态 | 创建时间 |
（根据 projectList 填充）`,
        dataModel: 'projects'
      }
    ],
    examples: `**用户**: 项目情况怎么样

**步骤1**: 获取项目状态统计（进行中/已完成/已取消各多少）
**步骤2**: 获取最近项目列表`
  }
];

async function upgradeAiMaps() {
  console.log('🔌 连接数据库...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ 数据库连接成功\n');

  const AiMap = mongoose.connection.collection('aimaps');

  console.log('📝 开始升级 AI 地图到 V2 架构...\n');

  let updatedCount = 0;
  let errorCount = 0;

  for (const mapData of v2Maps) {
    try {
      const result = await AiMap.updateOne(
        { mapId: mapData.mapId },
        {
          $set: {
            ...mapData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`  ✨ 新建地图: ${mapData.name} (${mapData.mapId})`);
      } else if (result.modifiedCount > 0) {
        console.log(`  ✅ 已升级: ${mapData.name} (${mapData.mapId})`);
      } else {
        console.log(`  ⏭️  无变化: ${mapData.name} (${mapData.mapId})`);
      }
      updatedCount++;
    } catch (error) {
      console.error(`  ❌ 失败: ${mapData.name} - ${error}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 升级统计:`);
  console.log(`  ✅ 成功: ${updatedCount}`);
  console.log(`  ❌ 失败: ${errorCount}`);

  // 验证升级结果
  console.log('\n📋 验证 V2 字段完整性...');
  const allMaps = await AiMap.find({ enabled: true }).toArray();

  let v2CompliantCount = 0;
  for (const map of allMaps) {
    const steps = (map as any).steps || [];
    const hasV2Fields = steps.every((step: any) =>
      step.name &&
      (step.toolId || step.condition) && // 有工具ID 或 是条件步骤
      (step.nextStepPrompt || step.order === steps.length) // 有下一步提示 或 是最后一步
    );

    if (hasV2Fields) {
      v2CompliantCount++;
    } else {
      console.log(`  ⚠️  不完整: ${(map as any).name} (${(map as any).mapId})`);
    }
  }

  console.log(`\n📊 V2 合规率: ${v2CompliantCount}/${allMaps.length} (${Math.round(v2CompliantCount / allMaps.length * 100)}%)`);

  await mongoose.disconnect();
  console.log('\n🔌 数据库连接已关闭');
}

// 执行升级
upgradeAiMaps().catch(console.error);


