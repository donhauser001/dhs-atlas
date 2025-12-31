/**
 * Task Manager 单元测试
 * 
 * 测试 V2 架构的任务管理功能
 */

import {
  createTaskListFromMap,
  startTaskList,
  completeCurrentStep,
  failCurrentStep,
  generateTaskProgressPrompt,
  getCurrentStep,
  isTaskListCompleted,
  isTaskListFailed,
  getCompletionPercentage,
} from '../ai/agent/task-manager';
import type { IAiMapStep } from '../models/AiMap';

describe('Task Manager', () => {
  // 测试用的地图步骤
  const mockSteps: IAiMapStep[] = [
    {
      order: 1,
      name: '获取客户信息',
      action: '查询客户详情',
      toolId: 'crm.client_detail',
      paramsTemplate: { clientName: '{{clientName}}' },
      outputKey: 'clientInfo',
      nextStepPrompt: '✅ 步骤1完成，下一步查询报价单',
    },
    {
      order: 2,
      name: '获取报价单',
      action: '查询报价单详情',
      toolId: 'db.query',
      paramsTemplate: { collection: 'quotations' },
      outputKey: 'quotationInfo',
      nextStepPrompt: '✅ 步骤2完成，下一步查询服务价格',
    },
    {
      order: 3,
      name: '获取服务价格',
      action: '查询服务价格列表',
      toolId: 'db.query',
      paramsTemplate: { collection: 'servicepricings' },
      outputKey: 'services',
    },
  ];

  describe('createTaskListFromMap', () => {
    it('应该正确创建任务列表', () => {
      const taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);

      expect(taskList.mapId).toBe('test_map');
      expect(taskList.mapName).toBe('测试地图');
      expect(taskList.tasks).toHaveLength(3);
      expect(taskList.totalSteps).toBe(3);
      expect(taskList.currentStep).toBe(0);
      expect(taskList.status).toBe('pending');
    });

    it('应该正确设置每个任务的初始状态', () => {
      const taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);

      taskList.tasks.forEach((task, index) => {
        expect(task.stepNumber).toBe(index + 1);
        expect(task.name).toBe(mockSteps[index].name);
        expect(task.toolId).toBe(mockSteps[index].toolId);
        expect(task.status).toBe('pending');
      });
    });
  });

  describe('startTaskList', () => {
    it('应该将任务列表状态设为 running', () => {
      const taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      const started = startTaskList(taskList);

      expect(started.status).toBe('running');
      expect(started.currentStep).toBe(1);
    });

    it('应该将第一个任务状态设为 in_progress', () => {
      const taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      const started = startTaskList(taskList);

      expect(started.tasks[0].status).toBe('in_progress');
      expect(started.tasks[0].startTime).toBeDefined();
    });
  });

  describe('completeCurrentStep', () => {
    it('应该正确标记当前步骤为完成', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);
      taskList = completeCurrentStep(taskList, '找到客户信息');

      expect(taskList.tasks[0].status).toBe('completed');
      expect(taskList.tasks[0].resultSummary).toBe('找到客户信息');
      expect(taskList.tasks[0].endTime).toBeDefined();
    });

    it('应该自动开始下一个步骤', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);
      taskList = completeCurrentStep(taskList, '找到客户信息');

      expect(taskList.currentStep).toBe(2);
      expect(taskList.tasks[1].status).toBe('in_progress');
    });

    it('完成最后一步后应该将任务列表状态设为 completed', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);
      taskList = completeCurrentStep(taskList, '步骤1完成');
      taskList = completeCurrentStep(taskList, '步骤2完成');
      taskList = completeCurrentStep(taskList, '步骤3完成');

      expect(taskList.status).toBe('completed');
      expect(isTaskListCompleted(taskList)).toBe(true);
    });
  });

  describe('failCurrentStep', () => {
    it('应该正确标记当前步骤为失败', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);
      taskList = failCurrentStep(taskList, '客户不存在');

      expect(taskList.tasks[0].status).toBe('failed');
      expect(taskList.tasks[0].error).toBe('客户不存在');
      expect(taskList.status).toBe('failed');
      expect(isTaskListFailed(taskList)).toBe(true);
    });
  });

  describe('generateTaskProgressPrompt', () => {
    it('应该生成正确的进度提示', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);

      const prompt = generateTaskProgressPrompt(taskList);

      expect(prompt).toContain('测试地图');
      expect(prompt).toContain('1/3');
      expect(prompt).toContain('获取客户信息');
      expect(prompt).toContain('执行中');
    });

    it('完成步骤后应该显示结果摘要', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);
      taskList = completeCurrentStep(taskList, '找到 5 条数据');

      const prompt = generateTaskProgressPrompt(taskList);

      expect(prompt).toContain('✅');
      expect(prompt).toContain('找到 5 条数据');
    });
  });

  describe('getCurrentStep', () => {
    it('应该返回当前正在执行的步骤', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);

      const currentStep = getCurrentStep(taskList);

      expect(currentStep).toBeDefined();
      expect(currentStep?.name).toBe('获取客户信息');
      expect(currentStep?.status).toBe('in_progress');
    });

    it('未开始时应该返回 null', () => {
      const taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      const currentStep = getCurrentStep(taskList);

      expect(currentStep).toBeNull();
    });
  });

  describe('getCompletionPercentage', () => {
    it('应该正确计算完成百分比', () => {
      let taskList = createTaskListFromMap('test_map', '测试地图', mockSteps);
      taskList = startTaskList(taskList);

      expect(getCompletionPercentage(taskList)).toBe(0);

      taskList = completeCurrentStep(taskList);
      expect(getCompletionPercentage(taskList)).toBe(33);

      taskList = completeCurrentStep(taskList);
      expect(getCompletionPercentage(taskList)).toBe(67);

      taskList = completeCurrentStep(taskList);
      expect(getCompletionPercentage(taskList)).toBe(100);
    });
  });
});


