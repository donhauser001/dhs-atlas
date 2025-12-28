# AI 原生架构违规示例清单

> **文档版本**: v1.0  
> **创建日期**: 2024-12-28  
> **文档性质**: 反模式清单 / PR 审查指南 / Cursor 约束规则  
> **约束对象**: 开发者、AI 助手（Cursor）、Code Review 流程

---

## 使用说明

本文档列出**所有违反 AI 原生架构的代码模式**。

**用途**：
1. **PR Review**：任何命中本清单的代码，应被打回
2. **Cursor 约束**：AI 生成代码时的自检清单
3. **新人培训**：理解「什么不能做」比「什么能做」更重要

**严重程度分级**：
- 🔴 **Critical**：架构根基性违规，必须立即修复
- 🟠 **Major**：严重偏离，应在当前 PR 修复
- 🟡 **Minor**：轻微偏离，可创建 Follow-up 修复

---

## 一、Tool Protocol 违规

### 🔴 V-TOOL-001：绕过 Tool 直接调用业务 API

**违规代码**：
```typescript
// ❌ 前端组件直接调用业务 API
const handleAnalyze = async () => {
  const result = await fetch('/api/contracts/parse', {
    method: 'POST',
    body: formData
  });
  setParseResult(result);
};
```

**正确做法**：
```typescript
// ✅ 通过 Tool 调用
const handleAnalyze = async () => {
  const result = await toolExecutor.execute('contract.parse', {
    file: formData
  });
  // 结果通过 UISpec 渲染
};
```

**为什么是违规**：
- AI 无法调用这个能力（只有人能点按钮）
- 违反「人机双轨等价」原则
- 无法被审计、限流、权限控制

---

### 🔴 V-TOOL-002：在前端写业务逻辑

**违规代码**：
```typescript
// ❌ 前端计算风险评分
const calculateRiskScore = (clauses: Clause[]) => {
  let score = 100;
  clauses.forEach(clause => {
    if (clause.type === 'payment' && clause.days > 30) {
      score -= 20;
    }
    // ... 更多业务逻辑
  });
  return score;
};
```

**正确做法**：
```typescript
// ✅ 风险计算封装为 Tool，前端只负责展示
const result = await toolExecutor.execute('contract.risk_scan', {
  contractId: contract.id
});
// result.data.riskScore 由后端计算
```

**为什么是违规**：
- 核心业务逻辑在前端，AI 无法复用
- 逻辑分散，难以维护
- 违反「能力必须走协议」红线

---

### 🟠 V-TOOL-003：Tool 返回值不符合 Schema

**违规代码**：
```typescript
// ❌ Tool 返回非标准格式
export const parseContract = async (params) => {
  const parsed = await parser.parse(params.file);
  return parsed;  // 直接返回原始数据
};
```

**正确做法**：
```typescript
// ✅ 返回标准 ToolResult
export const parseContract = async (params): Promise<ToolResult<ParsedContract>> => {
  const parsed = await parser.parse(params.file);
  return {
    success: true,
    data: parsed,
    artifacts: {
      id: parsed.id,
      type: 'parsed_contract'
    },
    nextHints: ['扫描风险', '查看条款详情'],
    uiSuggestion: {
      componentId: 'AiDetails',
      props: { data: parsed }
    }
  };
};
```

**为什么是违规**：
- Agent 无法获取 `artifacts` 进行后续编排
- 无法生成 `nextHints` 预判指令
- 无法推荐合适的 UI 组件

---

### 🟠 V-TOOL-004：Tool 没有进度报告

**违规代码**：
```typescript
// ❌ 长时间操作没有进度反馈
export const scanRisks = async (params) => {
  const clauses = await getAllClauses(params.contractId);
  const risks = [];
  for (const clause of clauses) {
    const risk = await analyzeClause(clause);  // 可能很慢
    if (risk) risks.push(risk);
  }
  return { success: true, data: risks };
};
```

**正确做法**：
```typescript
// ✅ 报告真实进度
export const scanRisks = async (params, context: ExecutionContext) => {
  const clauses = await getAllClauses(params.contractId);
  const risks = [];
  
  for (let i = 0; i < clauses.length; i++) {
    // 报告进度
    context.reportProgress({
      percent: Math.round((i / clauses.length) * 100),
      stage: 'scanning',
      message: `扫描条款 ${i + 1}/${clauses.length}: ${clauses[i].title}`
    });
    
    const risk = await analyzeClause(clauses[i]);
    if (risk) {
      risks.push(risk);
      // 报告中间发现
      context.reportProgress({
        percent: Math.round((i / clauses.length) * 100),
        stage: 'scanning',
        message: `发现风险: ${risk.description}`,
        intermediateResult: { foundRisks: risks.length }
      });
    }
  }
  
  return { success: true, data: risks };
};
```

**为什么是违规**：
- 用户看不到真实进度，体验差
- 违反「真实交互，禁止表演」原则
- 无法实现可中断

---

## 二、UI Protocol 违规

### 🔴 V-UI-001：AI 直接生成 JSX/组件

**违规代码**：
```typescript
// ❌ Agent 返回 React 组件
const agentResponse = {
  message: '分析完成',
  ui: <RiskReport data={risks} onFix={handleFix} />  // 直接返回 JSX
};
```

**正确做法**：
```typescript
// ✅ Agent 返回 UISpec
const agentResponse = {
  message: '分析完成',
  uiSuggestion: {
    componentId: 'AiReviewPanel',
    props: {
      title: '风险扫描报告',
      items: risks.map(r => ({
        id: r.id,
        label: r.description,
        severity: r.level
      }))
    }
  }
};

// 由 AIInteractionHost 渲染
const ui = renderFromSpec(agentResponse.uiSuggestion);
```

**为什么是违规**：
- AI 拥有了 UI 决策权，违反架构红线
- 无法校验、无法约束
- 前后端耦合

---

### 🔴 V-UI-002：绕过 Interaction Orchestrator 直接渲染

**违规代码**：
```typescript
// ❌ Role 直接调用 render
class LegalExpert {
  async analyze(contract) {
    const risks = await this.scanRisks(contract);
    
    // 直接渲染 UI，绕过 Orchestrator
    renderComponent('AiReviewPanel', { items: risks });
    
    return risks;
  }
}
```

**正确做法**：
```typescript
// ✅ Role 只返回 uiSuggestion，由 Orchestrator 决定
class LegalExpert {
  async analyze(contract): Promise<RoleOutput> {
    const risks = await this.scanRisks(contract);
    
    return {
      data: risks,
      uiSuggestion: {
        componentId: 'AiReviewPanel',
        props: { items: risks },
        priority: 'recommended'  // 只是建议，不是命令
      }
    };
  }
}

// Orchestrator 决定是否渲染、如何渲染
const decision = orchestrator.requestUI(roleOutput.uiSuggestion);
if (decision.action === 'render') {
  renderToCanvas(decision.spec);
}
```

**为什么是违规**：
- 违反「Interaction Orchestrator 拥有 UI 最终裁决权」红线
- Role 不应该知道自己的输出如何被呈现
- 无法实现打断、排队、优先级控制

---

### 🟠 V-UI-003：使用非注册组件

**违规代码**：
```typescript
// ❌ 返回未注册的组件 ID
const uiSuggestion = {
  componentId: 'CustomRiskChart',  // 不在 8 个交互原语中
  props: { data: chartData }
};
```

**正确做法**：
```typescript
// ✅ 只使用已注册的交互原语
const uiSuggestion = {
  componentId: 'AiDetails',  // 已注册的组件
  props: {
    title: '风险分布',
    fields: [
      { label: '高风险', value: '3 项' },
      { label: '中风险', value: '5 项' },
      { label: '低风险', value: '2 项' }
    ]
  }
};
```

**为什么是违规**：
- AIInteractionHost 无法渲染未注册组件
- Props 无法被校验
- 破坏组件一致性

---

### 🟠 V-UI-004：魔改 shadcn 组件

**违规代码**：
```tsx
// ❌ 修改 shadcn Button 内部实现
// components/ui/button.tsx
export const Button = ({ children, ...props }) => {
  // 添加了自定义的动画逻辑
  const [isAnimating, setIsAnimating] = useState(false);
  
  return (
    <motion.button
      animate={isAnimating ? { scale: 1.1 } : {}}
      // ... 大量自定义逻辑
    >
      {children}
    </motion.button>
  );
};
```

**正确做法**：
```tsx
// ✅ 保持 shadcn 组件原样，通过组合实现扩展
import { Button } from '@/components/ui/button';

export const AnimatedButton = ({ children, ...props }) => {
  return (
    <motion.div animate={{ scale: 1 }}>
      <Button {...props}>{children}</Button>
    </motion.div>
  );
};
```

**为什么是违规**：
- 违反「严格使用 shadcn/ui，不魔改」约束
- 破坏组件库一致性
- 升级 shadcn 时会冲突

---

### 🟡 V-UI-005：使用 Emoji

**违规代码**：
```tsx
// ❌ 在 UI 中使用 emoji
<div className="status">
  🚀 正在处理...
</div>

<Button>
  ✅ 确认
</Button>
```

**正确做法**：
```tsx
// ✅ 使用 Lucide Icons
import { Rocket, Check } from 'lucide-react';

<div className="status">
  <Rocket className="w-4 h-4" /> 正在处理...
</div>

<Button>
  <Check className="w-4 h-4" /> 确认
</Button>
```

**为什么是违规**：
- Emoji 是非结构化、不可解析的噪声
- 违反项目规范
- 不同平台渲染不一致

---

## 三、Workflow 违规

### 🔴 V-WF-001：在非当前状态调用 Tool

**违规代码**：
```typescript
// ❌ 在 upload 状态调用 risk_scan
const workflow = new WorkflowRuntime(analyzeDocumentWorkflow);
workflow.start();  // 当前状态: upload

// 违规：upload 状态的 allowedTools 不包含 risk_scan
await toolExecutor.execute('contract.risk_scan', { contractId });
```

**正确做法**：
```typescript
// ✅ 先迁移到正确状态，再调用
const workflow = new WorkflowRuntime(analyzeDocumentWorkflow);
workflow.start();  // upload

// 1. 完成 upload
await toolExecutor.execute('files.upload', { file });
workflow.transition('file.uploaded');  // -> analyzing

// 2. 在 analyzing 状态调用 risk_scan
await toolExecutor.execute('contract.risk_scan', { contractId });
```

**为什么是违规**：
- 破坏状态机约束
- Tool 调用失去可预测性
- 流程无法被审计

---

### 🟠 V-WF-002：硬编码状态迁移

**违规代码**：
```typescript
// ❌ 直接修改状态，绕过 transitions
workflow.currentState = 'review';  // 直接赋值
```

**正确做法**：
```typescript
// ✅ 通过事件触发迁移
workflow.transition('analysis.complete');  // upload -> analyzing -> review
```

**为什么是违规**：
- 绕过 transitions 校验
- 无法触发状态变更钩子
- 事件日志不完整

---

### 🟠 V-WF-003：在 Workflow 外执行多步骤任务

**违规代码**：
```typescript
// ❌ 手动串联多个 Tool，没有 Workflow 管理
const handleFullAnalysis = async (file) => {
  const uploaded = await toolExecutor.execute('files.upload', { file });
  const parsed = await toolExecutor.execute('contract.parse', { fileId: uploaded.data.id });
  const risks = await toolExecutor.execute('contract.risk_scan', { contractId: parsed.data.id });
  const patches = await toolExecutor.execute('contract.propose_patch', { risks });
  // ... 没有状态管理，没有可恢复性
};
```

**正确做法**：
```typescript
// ✅ 使用 Workflow 管理多步骤任务
const workflow = workflowRuntime.start('analyze_document', {
  file,
  onStateChange: (state) => updateUI(state),
  onError: (error, state) => handleRecovery(error, state)
});
```

**为什么是违规**：
- 无法断点恢复
- 无法展示当前进度
- 无法被中断

---

## 四、角色系统违规

### 🔴 V-ROLE-001：角色调用白名单外的 Tool

**违规代码**：
```typescript
// ❌ Legal Expert 调用不在白名单的 Tool
class LegalExpert {
  async analyze(contract) {
    // Legal Expert 的 allowedTools 不包含 apply_patch
    await toolExecutor.execute('contract.apply_patch', { patches });
  }
}
```

**正确做法**：
```typescript
// ✅ Legal Expert 只生成建议，由 Executor 应用
class LegalExpert {
  async analyze(contract): Promise<RoleOutput> {
    const patches = await toolExecutor.execute('contract.propose_patch', { contract });
    return {
      data: patches,
      // 建议由 Executor 执行 apply_patch
    };
  }
}

// Executor 在 Reviewer 审批后执行
class Executor {
  async applyPatches(patches, approval: ApprovalRecord) {
    if (!approval.approved) throw new Error('Not approved');
    await toolExecutor.execute('contract.apply_patch', { patches });
  }
}
```

**为什么是违规**：
- 破坏角色权限边界
- 违反「角色权限不可绕过」红线
- 审批流程被跳过

---

### 🟠 V-ROLE-002：角色输出不符合 Schema

**违规代码**：
```typescript
// ❌ Legal Expert 返回非结构化输出
class LegalExpert {
  async analyze(contract) {
    return {
      message: '这份合同有几个风险点，建议修改付款条款和知识产权条款。',
      // 没有结构化的 risks 数组
      // 没有 clauseLocation 定位
      // 没有 riskType 分级
    };
  }
}
```

**正确做法**：
```typescript
// ✅ 返回符合 Schema 的结构化输出
class LegalExpert {
  async analyze(contract): Promise<LegalExpertOutput> {
    return {
      risks: [
        {
          id: 'risk-001',
          clauseLocation: {
            section: '付款条款',
            paragraph: 3,
            lineRange: [45, 52]
          },
          riskType: 'high',
          description: '付款周期过长（60天）',
          suggestedAction: 'modify',
          evidence: '行业标准为 15-30 天',
          patchSuggestion: '将 60 天修改为 15 天'
        },
        // ...
      ],
      summary: {
        totalRisks: 3,
        highRisks: 1,
        overallAssessment: '中等风险，建议修订后签署'
      }
    };
  }
}
```

**为什么是违规**：
- 下游 Role 无法处理非结构化输出
- 无法自动生成 UI
- 无法被验证和测试

---

### 🟠 V-ROLE-003：绕过 Reviewer 直接执行敏感操作

**违规代码**：
```typescript
// ❌ Executor 没有检查审批状态
class Executor {
  async applyPatches(patches) {
    // 直接执行，没有检查 approval
    await toolExecutor.execute('contract.apply_patch', { patches });
  }
}
```

**正确做法**：
```typescript
// ✅ 必须检查审批状态
class Executor {
  async applyPatches(patches, context: ExecutionContext) {
    // 检查是否已审批
    const approval = await stateStore.getApproval(patches.id);
    if (!approval || !approval.approved) {
      throw new ApprovalRequiredError('Patches must be approved by Reviewer');
    }
    
    // 只执行已审批的 patches
    const approvedPatches = patches.filter(p => 
      approval.items.find(i => i.id === p.id && i.approved)
    );
    
    await toolExecutor.execute('contract.apply_patch', { 
      patches: approvedPatches 
    });
  }
}
```

**为什么是违规**：
- 破坏审批流程
- 违反「requiresApproval 约束」
- 敏感操作无人审核

---

## 五、人机双轨违规

### 🔴 V-DUAL-001：UI 操作不走 Command

**违规代码**：
```tsx
// ❌ 按钮直接调用 API，不走 Command
<Button onClick={async () => {
  const result = await fetch('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  router.push(`/contracts/${result.id}`);
}}>
  创建合同
</Button>
```

**正确做法**：
```tsx
// ✅ 通过 Command 执行
<Button onClick={() => executeCommand('contract.create', formData)}>
  创建合同
</Button>

// command 定义
const contractCreateCommand: Command = {
  id: 'contract.create',
  name: '创建合同',
  level: 'L3',  // 需要确认
  execute: async (params) => {
    return await toolExecutor.execute('contract.create', params);
  }
};
```

**为什么是违规**：
- AI 无法调用这个操作
- 违反「人机双轨等价」原则
- 操作不可审计

---

### 🟠 V-DUAL-002：AI 专属能力

**违规代码**：
```typescript
// ❌ 某个 Tool 只能被 AI 调用，人无法手动触发
const batchAnalyze = async (contracts: Contract[]) => {
  // 这个能力没有对应的 UI 入口
  // 只有 AI 能调用
};
```

**正确做法**：
```typescript
// ✅ Tool 有对应的 UI 入口
// 1. 注册 Tool
registerTool({
  id: 'contract.batch_analyze',
  name: '批量分析合同',
  // ...
});

// 2. UI 入口
<Button onClick={() => executeCommand('contract.batch_analyze', {
  contractIds: selectedContracts
})}>
  批量分析
</Button>

// 3. AI 也能调用
await toolExecutor.execute('contract.batch_analyze', { contractIds });
```

**为什么是违规**：
- 破坏「AI 能做的，人也能做」原则
- 造成能力不对等

---

### 🟠 V-DUAL-003：人专属能力

**违规代码**：
```tsx
// ❌ 某个操作只能通过 UI 完成，AI 无法调用
<Button onClick={() => {
  // 直接操作 DOM 或调用浏览器 API
  window.print();
  
  // 或者触发下载
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = 'contract.pdf';
  link.click();
}}>
  打印/下载
</Button>
```

**正确做法**：
```typescript
// ✅ 封装为 Tool，AI 也能调用
registerTool({
  id: 'contract.export_pdf',
  name: '导出 PDF',
  execute: async (params) => {
    const pdfBuffer = await generatePDF(params.contractId);
    return {
      success: true,
      data: { url: await uploadToStorage(pdfBuffer) },
      uiSuggestion: {
        componentId: 'AiModalConfirm',
        props: {
          title: 'PDF 已生成',
          message: '点击下载',
          actions: [{ label: '下载', href: data.url }]
        }
      }
    };
  }
});
```

**为什么是违规**：
- AI 无法完成导出任务
- 违反「如果关掉所有 UI，AI 是否还能完成」标准

---

## 六、预判指令违规

### 🔴 V-PRED-001：预判指令自动执行

**违规代码**：
```typescript
// ❌ 点击预判指令直接执行
<PredictedAction 
  action={action}
  onClick={() => {
    // 直接执行，没有确认
    executeCommand(action.tool, action.params);
  }}
/>
```

**正确做法**：
```typescript
// ✅ 点击后显示确认
<PredictedAction 
  action={action}
  onClick={() => {
    // 显示确认对话框
    showConfirmDialog({
      title: '即将执行',
      description: `操作：${action.label}`,
      params: action.params,
      onConfirm: () => executeCommand(action.tool, action.params),
      onCancel: () => {}
    });
  }}
/>
```

**为什么是违规**：
- 违反「预判指令默认需人确认」红线
- 用户失去控制权
- 可能误触发危险操作

---

## 七、假交互违规

### 🔴 V-FAKE-001：假进度条

**违规代码**：
```tsx
// ❌ 进度条是假的，和实际执行无关
const [progress, setProgress] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setProgress(p => Math.min(p + 10, 90));  // 假装在进步
  }, 500);
  
  // 等真实结果返回后直接跳到 100
  fetchResult().then(() => {
    clearInterval(timer);
    setProgress(100);
  });
}, []);

<ProgressBar value={progress} />
```

**正确做法**：
```tsx
// ✅ 进度来自真实的 SSE 事件
const [progress, setProgress] = useState(0);

useEffect(() => {
  const eventSource = new EventSource(`/api/progress/${requestId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setProgress(data.percent);  // 真实进度
    setStage(data.stage);
    setMessage(data.message);
  };
  
  return () => eventSource.close();
}, [requestId]);

<ProgressBar value={progress} />
<div>{stage}: {message}</div>
```

**为什么是违规**：
- 违反「真实交互，禁止表演」原则
- 欺骗用户
- 无法实现真正的可中断

---

### 🔴 V-FAKE-002：假思考过程

**违规代码**：
```tsx
// ❌ 事先写好的「思考」动画
const thinkingSteps = [
  '正在理解你的需求...',
  '分析合同结构...',
  '识别潜在风险...',
  '生成建议...'
];

// 每隔 1 秒显示下一句，和实际处理无关
const [stepIndex, setStepIndex] = useState(0);
useEffect(() => {
  const timer = setInterval(() => {
    setStepIndex(i => (i + 1) % thinkingSteps.length);
  }, 1000);
}, []);
```

**正确做法**：
```tsx
// ✅ 显示真实的执行阶段
const [stage, setStage] = useState('');

// 来自真实的工具执行进度
toolExecutor.onProgress((progress) => {
  setStage(progress.message);  // "扫描条款 5/12: 付款条款"
});
```

**为什么是违规**：
- AI 没做的事不允许展示
- 「演出来的智能」是被明确禁止的

---

### 🟠 V-FAKE-003：事后拼装的流式输出

**违规代码**：
```typescript
// ❌ 结果已经全部生成，假装流式输出
const fullResponse = await generateFullResponse();

// 逐字「播放」给用户看
for (const char of fullResponse) {
  await sleep(50);
  appendToUI(char);
}
```

**正确做法**：
```typescript
// ✅ 真正的流式生成
const stream = await llm.streamGenerate(prompt);

for await (const chunk of stream) {
  appendToUI(chunk);  // 真实的流式 token
}
```

**为什么是违规**：
- 这是「已完成结果的假播放」
- 浪费用户时间
- 欺骗行为

---

## 八、样式违规

> 以下违规同时参考 `docs/UI_STYLE_GUIDELINES.md`

### 🟠 V-STYLE-001：使用内联样式

**违规代码**：
```tsx
// ❌ 内联样式
<div style={{ 
  padding: '16px',
  backgroundColor: '#fff',
  borderRadius: '8px'
}}>
```

**正确做法**：
```tsx
// ✅ 使用 CSS 类
<div className="card-container">

// styles/components/card.css
.card-container {
  padding: var(--spacing-base);
  background-color: var(--bg-container);
  border-radius: var(--radius-base);
}
```

---

### 🟠 V-STYLE-002：硬编码颜色/尺寸

**违规代码**：
```css
/* ❌ 硬编码值 */
.button {
  background-color: #ff6b00;
  padding: 12px 24px;
  border-radius: 8px;
}
```

**正确做法**：
```css
/* ✅ 使用 CSS 变量 */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-base);
}
```

---

### 🟡 V-STYLE-003：使用渐变背景

**违规代码**：
```css
/* ❌ 渐变背景 */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**正确做法**：
```css
/* ✅ 纯色背景 */
.hero {
  background-color: var(--bg-elevated);
}
```

---

## 九、PR 审查清单

在 Code Review 时，检查以下项目：

### 必检项（🔴 Critical）

- [ ] 是否有业务逻辑绕过 Tool？
- [ ] 是否有 AI 直接生成 JSX？
- [ ] 是否有绕过 Orchestrator 的 UI 渲染？
- [ ] 是否有角色调用白名单外的 Tool？
- [ ] 是否有预判指令自动执行？
- [ ] 是否有假进度条/假思考？

### 重点检项（🟠 Major）

- [ ] Tool 返回值是否符合 ToolResult Schema？
- [ ] 长时间操作是否有进度报告？
- [ ] UI 操作是否走 Command？
- [ ] 状态迁移是否通过 transition？
- [ ] 角色输出是否符合 Schema？
- [ ] 是否有内联样式或硬编码值？

### 建议检项（🟡 Minor）

- [ ] 是否使用了 Emoji？
- [ ] 是否使用了渐变背景？
- [ ] 组件是否可以复用已有的交互原语？

---

## 十、Cursor 自检指令

在让 Cursor 生成代码前，可以添加以下提示：

```
在生成代码前，请检查：
1. 业务逻辑是否封装为 Tool？
2. UI 是否通过 UISpec 而不是直接 JSX？
3. 操作是否通过 Command 而不是直接事件处理？
4. 是否使用了 CSS 变量而不是硬编码值？
5. 长时间操作是否有真实进度报告？
6. 预判指令是否需要用户确认？
```

---

**文档结束**

> **版本历史**：
> - v1.0 (2024-12-28) - 初始版本，35 个违规示例

