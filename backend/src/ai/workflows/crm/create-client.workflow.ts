/**
 * 新建客户工作流
 * 
 * 🔴 只提供事实 + 可用命令，不编剧本
 * LLM 自己决定说什么、调用什么
 */

import type {
  WorkflowDefinition,
  WorkflowState,
  WorkflowStepResult,
  WorkflowHandlerContext,
  WorkflowStep,
  IWorkflowHandler,
  WorkflowCommand,
} from '../types';
import Client from '../../../models/Client';

// ============ 工作流定义 ============

const definition: WorkflowDefinition = {
  id: 'crm.create_client',
  name: '新建客户',
  description: '创建新客户',
  module: 'crm',
  triggers: [
    '新建客户', '创建客户', '添加客户', '录入客户', '新增客户',
    '帮我创建', '帮我新建', '我想新建', '我要创建',
  ],
  formId: 'client-create',
  steps: [
    { id: 'init', name: '初始化' },
    { id: 'collect_name', name: '收集名称', fields: ['name'] },
    { id: 'check_duplicate', name: '查重' },
    { id: 'collect_details', name: '收集详情', fields: ['address', 'category'], optional: true },
    { id: 'ready', name: '就绪' },
  ],
};

// ============ 可用命令定义 ============

const COMMANDS = {
  openCreateForm: {
    id: 'open_create_form',
    name: '打开新建客户表单',
    description: '在画布上打开空白的新建客户表单',
    type: 'form' as const,
  },
  openFormWithData: {
    id: 'open_form_with_data',
    name: '打开表单并预填数据',
    description: '在画布上打开新建客户表单，并预填指定字段',
    type: 'form' as const,
    params: {
      name: { type: 'string', description: '客户名称', required: false },
      address: { type: 'string', description: '地址', required: false },
    },
  },
  searchClient: {
    id: 'search_client',
    name: '搜索客户',
    description: '在数据库中搜索是否存在相似客户',
    type: 'api' as const,
    params: {
      keyword: { type: 'string', description: '搜索关键词', required: true },
    },
  },
  viewClient: {
    id: 'view_client',
    name: '查看客户详情',
    description: '打开已存在客户的详情',
    type: 'form' as const,
    params: {
      clientId: { type: 'string', description: '客户 ID', required: true },
    },
  },
  updateFormField: {
    id: 'update_form_field',
    name: '更新表单字段',
    description: '更新画布上表单的某个字段值',
    type: 'form' as const,
    params: {
      field: { type: 'string', description: '字段名', required: true },
      value: { type: 'string', description: '字段值', required: true },
    },
  },
  confirmSubmit: {
    id: 'confirm_submit',
    name: '确认提交',
    description: '提示用户点击表单提交按钮',
    type: 'confirm' as const,
  },
};

// ============ 工作流处理器 ============

class CreateClientWorkflow implements IWorkflowHandler {
  readonly definition = definition;

  canTrigger(message: string, context?: Record<string, unknown>): boolean {
    const lower = message.toLowerCase();
    
    for (const trigger of this.definition.triggers) {
      if (lower.includes(trigger.toLowerCase())) {
        return true;
      }
    }
    
    if (context?.module === 'clients') {
      if (lower.includes('新建') || lower.includes('创建') || lower.includes('添加')) {
        return true;
      }
    }
    
    return false;
  }

  initialize(sessionId: string, context?: Record<string, unknown>): WorkflowState {
    const steps: WorkflowStep[] = this.definition.steps.map(s => ({
      id: s.id,
      name: s.name,
      status: 'pending',
    }));

    steps[0].status = 'active';

    return {
      workflowId: this.definition.id,
      sessionId,
      status: 'active',
      currentStepIndex: 0,
      steps,
      collectedData: {},
      context: context || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async handleInput(ctx: WorkflowHandlerContext): Promise<WorkflowStepResult> {
    const { state, userMessage } = ctx;
    const currentStep = state.steps[state.currentStepIndex];

    console.log(`[CreateClientWorkflow] Step: ${currentStep.id}, Input: ${userMessage}`);

    switch (currentStep.id) {
      case 'init':
        return this.handleInit(ctx);
      case 'collect_name':
        return this.handleCollectName(ctx);
      case 'check_duplicate':
        return this.handleCheckDuplicate(ctx);
      case 'collect_details':
        return this.handleCollectDetails(ctx);
      case 'ready':
        return this.handleReady(ctx);
      default:
        return this.errorResult('状态异常');
    }
  }

  // ============ 步骤处理 ============

  private handleInit(ctx: WorkflowHandlerContext): WorkflowStepResult {
    const { state, userMessage } = ctx;
    
    const extractedName = this.extractClientName(userMessage);
    
    this.completeStep(state, 0);
    
    if (extractedName) {
      // 用户在触发时提供了名称
      state.collectedData.name = extractedName;
      this.skipStep(state, 1);
      this.activateStep(state, 2); // 进入查重
      
      return {
        uiSpec: {
          componentId: 'AiForm',
          props: {
            formId: 'client-create',
            mode: 'create',
            title: '新建客户',
            initialValues: { name: extractedName },
          },
          target: 'canvas',
        },
        formUpdates: { name: extractedName },
        context: {
          facts: {
            workflow: '新建客户',
            step: '查重',
            collected: { name: extractedName },
            lastOperation: {
              type: 'extract_name',
              success: true,
              data: { name: extractedName },
            },
          },
          availableCommands: [
            COMMANDS.searchClient,
          ],
          fieldsToCollect: [],
        },
      };
    }
    
    // 没有提供名称，需要收集
    this.activateStep(state, 1);
    
    return {
      uiSpec: {
        componentId: 'AiForm',
        props: {
          formId: 'client-create',
          mode: 'create',
          title: '新建客户',
        },
        target: 'canvas',
      },
      context: {
        facts: {
          workflow: '新建客户',
          step: '收集名称',
          collected: {},
        },
        availableCommands: [
          COMMANDS.openCreateForm,
          COMMANDS.updateFormField,
        ],
        fieldsToCollect: [
          { name: 'name', label: '客户名称', required: true },
        ],
      },
    };
  }

  private async handleCollectName(ctx: WorkflowHandlerContext): Promise<WorkflowStepResult> {
    const { state, userMessage } = ctx;
    
    const name = this.extractClientName(userMessage) || userMessage.trim();
    
    if (!name || name.length < 2) {
      return {
        context: {
          facts: {
            workflow: '新建客户',
            step: '收集名称',
            collected: state.collectedData,
            lastOperation: {
              type: 'extract_name',
              success: false,
              error: '无法从用户输入中识别客户名称',
            },
          },
          availableCommands: [COMMANDS.updateFormField],
          fieldsToCollect: [
            { name: 'name', label: '客户名称', required: true },
          ],
        },
      };
    }
    
    // 保存名称
    state.collectedData.name = name;
    this.completeStep(state, 1, { name });
    
    // 🔴 立即执行查重，不要等下一次用户输入
    return this.executeCheckDuplicate(state, name);
  }

  private async handleCheckDuplicate(ctx: WorkflowHandlerContext): Promise<WorkflowStepResult> {
    const { state } = ctx;
    const name = state.collectedData.name as string;
    return this.executeCheckDuplicate(state, name);
  }

  /**
   * 执行查重逻辑（可被多个步骤调用）
   */
  private async executeCheckDuplicate(state: WorkflowState, name: string): Promise<WorkflowStepResult> {
    try {
      const duplicates = await Client.find({
        $or: [
          { name: { $regex: name, $options: 'i' } },
          { name: { $regex: this.simplifyName(name), $options: 'i' } },
        ],
      }).limit(5).lean();
      
      this.completeStep(state, 2, { duplicates });
      
      if (duplicates.length > 0) {
        state.context.duplicates = duplicates;
        
        const duplicateList = duplicates.map(c => ({
          id: c._id.toString(),
          name: c.name,
          address: c.address || '',
        }));
        
        return {
          formUpdates: { name }, // 确保名称被填入表单
          context: {
            facts: {
              workflow: '新建客户',
              step: '查重结果',
              collected: state.collectedData,
              lastOperation: {
                type: 'search',
                success: true,
                data: {
                  found: duplicates.length,
                  clients: duplicateList,
                },
              },
            },
            availableCommands: [
              COMMANDS.viewClient,
              {
                id: 'continue_create',
                name: '继续创建',
                description: '忽略相似客户，继续创建新客户',
                type: 'confirm',
              },
            ],
          },
        };
      }
      
      // 没有重复，进入收集详情步骤
      this.activateStep(state, 3);
      
      return {
        formUpdates: { name }, // 确保名称被填入表单
        context: {
          facts: {
            workflow: '新建客户',
            step: '收集详情',
            collected: state.collectedData,
            lastOperation: {
              type: 'search',
              success: true,
              data: { found: 0, message: '数据库中没有找到相似客户，可以继续创建' },
            },
          },
          availableCommands: [
            COMMANDS.updateFormField,
            COMMANDS.confirmSubmit,
          ],
          fieldsToCollect: [
            { name: 'address', label: '地址', required: false },
            { name: 'category', label: '客户分类', required: false },
          ],
        },
      };
    } catch (error) {
      console.error('[Workflow] 查重失败:', error);
      
      this.activateStep(state, 3);
      
      return {
        context: {
          facts: {
            workflow: '新建客户',
            step: '收集详情',
            collected: state.collectedData,
            lastOperation: {
              type: 'search',
              success: false,
              error: '数据库查询失败',
            },
          },
          availableCommands: [
            COMMANDS.updateFormField,
            COMMANDS.confirmSubmit,
          ],
          fieldsToCollect: [
            { name: 'address', label: '地址', required: false },
          ],
        },
      };
    }
  }

  private handleCollectDetails(ctx: WorkflowHandlerContext): WorkflowStepResult {
    const { state, userMessage } = ctx;
    const lower = userMessage.toLowerCase();
    
    // 处理查重后的用户选择
    if (state.context.duplicates) {
      const duplicates = state.context.duplicates as Array<{ _id: string; name: string }>;
      
      // 用户选择查看某个客户
      const index = this.extractNumber(userMessage);
      if (index !== null && index >= 0 && index < duplicates.length) {
        const client = duplicates[index];
        state.status = 'completed';
        
        return {
          uiSpec: {
            componentId: 'AiForm',
            props: {
              formId: 'client-edit',
              mode: 'view',
              entityId: client._id.toString(),
            },
            target: 'canvas',
          },
          context: {
            facts: {
              workflow: '新建客户',
              step: '完成',
              collected: state.collectedData,
              lastOperation: {
                type: 'navigate',
                success: true,
                data: { action: 'view_existing', client },
              },
            },
            availableCommands: [],
          },
        };
      }
      
      // 用户选择继续创建
      if (lower.includes('继续') || lower.includes('新建') || lower.includes('不是')) {
        delete state.context.duplicates;
      }
    }
    
    // 用户说自己填
    if (lower.includes('自己') || lower.includes('手动') || lower.includes('我来')) {
      this.completeStep(state, 3);
      this.activateStep(state, 4);
      
      return {
        context: {
          facts: {
            workflow: '新建客户',
            step: '就绪',
            collected: state.collectedData,
          },
          availableCommands: [COMMANDS.confirmSubmit],
        },
      };
    }
    
    // 提取地址
    const address = this.extractAddress(userMessage);
    if (address) {
      state.collectedData.address = address;
      this.completeStep(state, 3, { address });
      this.activateStep(state, 4);
      
      return {
        formUpdates: { address },
        context: {
          facts: {
            workflow: '新建客户',
            step: '就绪',
            collected: state.collectedData,
            lastOperation: {
              type: 'collect_field',
              success: true,
              data: { field: 'address', value: address },
            },
          },
          availableCommands: [
            COMMANDS.updateFormField,
            COMMANDS.confirmSubmit,
          ],
        },
      };
    }
    
    // 无法识别
    return {
      context: {
        facts: {
          workflow: '新建客户',
          step: '收集详情',
          collected: state.collectedData,
          lastOperation: {
            type: 'parse_input',
            success: false,
            data: { input: userMessage },
          },
        },
        availableCommands: [
          COMMANDS.updateFormField,
          COMMANDS.confirmSubmit,
        ],
        fieldsToCollect: [
          { name: 'address', label: '地址', required: false },
        ],
      },
    };
  }

  private handleReady(ctx: WorkflowHandlerContext): WorkflowStepResult {
    const { state, userMessage } = ctx;
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('提交') || lower.includes('确认') || lower.includes('好')) {
      state.status = 'completed';
      
      return {
        context: {
          facts: {
            workflow: '新建客户',
            step: '完成',
            collected: state.collectedData,
          },
          availableCommands: [],
        },
      };
    }
    
    if (lower.includes('取消') || lower.includes('算了')) {
      state.status = 'cancelled';
      
      return {
        context: {
          facts: {
            workflow: '新建客户',
            step: '已取消',
            collected: state.collectedData,
          },
          availableCommands: [],
        },
      };
    }
    
    return {
      context: {
        facts: {
          workflow: '新建客户',
          step: '就绪',
          collected: state.collectedData,
        },
        availableCommands: [
          COMMANDS.updateFormField,
          COMMANDS.confirmSubmit,
        ],
      },
    };
  }

  // ============ 辅助方法 ============

  private completeStep(state: WorkflowState, index: number, data?: Record<string, unknown>): void {
    state.steps[index].status = 'completed';
    if (data) state.steps[index].data = data;
  }

  private activateStep(state: WorkflowState, index: number): void {
    state.currentStepIndex = index;
    state.steps[index].status = 'active';
  }

  private skipStep(state: WorkflowState, index: number): void {
    state.steps[index].status = 'skipped';
  }

  private errorResult(message: string): WorkflowStepResult {
    return {
      context: {
        facts: {
          workflow: '新建客户',
          step: '错误',
          collected: {},
          lastOperation: { type: 'error', success: false, error: message },
        },
        availableCommands: [],
      },
    };
  }

  private extractClientName(message: string): string | null {
    // 排除的通用词（不是真正的客户名称）
    const excludeWords = ['新客户', '客户', '一个客户', '新的客户', '这个客户'];
    
    const patterns = [
      // "客户叫XXX" 或 "名称是XXX"
      /(?:客户|名称)[叫是：:]\s*[「『"']?([^「『"'」』"\s]{2,50})[」』"']?/,
      // "创建一个叫XXX的客户" - 必须有"叫"字
      /(?:新建|创建|添加)(?:一个)?叫[「『"']?([^「『"'」』"\s]{2,50})[」』"']?/,
      // 引号包围的名称（如"中信出版社"）
      /[「『"']([^「『"'」』"]{2,50})[」』"']/,
      // 直接说公司名（如"中信出版社"）
      /(?:^|\s)([^「『"'」』"\s]{2,50}(?:公司|出版社|集团|中心|有限))(?:\s|$|的)/,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) {
        const name = match[1].trim();
        // 检查是否是排除词
        if (name.length >= 2 && !excludeWords.includes(name)) {
          return name;
        }
      }
    }
    
    // 整条消息像公司名
    const trimmed = message.trim();
    if (/^.{2,50}(公司|出版社|集团|中心|有限)$/.test(trimmed) && !excludeWords.includes(trimmed)) {
      return trimmed;
    }
    
    return null;
  }

  private extractAddress(message: string): string | null {
    let cleaned = message
      .replace(/^(?:地址[是为：:]|在|位于)\s*/i, '')
      .replace(/[。，,]$/, '')
      .trim();
    
    if (/(?:省|市|区|县|路|街|道|号|楼|室|大厦|广场)/.test(cleaned)) {
      return cleaned;
    }
    
    if (cleaned.length >= 5 && !cleaned.includes('？') && !cleaned.includes('?')) {
      return cleaned;
    }
    
    return null;
  }

  private extractNumber(message: string): number | null {
    const match = message.match(/[1-5]/);
    return match ? parseInt(match[0]) - 1 : null;
  }

  private simplifyName(name: string): string {
    return name.replace(/有限公司|股份有限公司|出版社|集团|有限/g, '');
  }
}

export const createClientWorkflow = new CreateClientWorkflow();
export default createClientWorkflow;
