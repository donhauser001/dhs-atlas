/**
 * Agent API 控制器
 * 
 * 处理 AI Agent 相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { processAgentRequest, confirmAndExecuteTools } from '../ai/agent';
import { registerAllTools, toolRegistry } from '../ai/tools';
import AiModel from '../models/AiModel';

// 确保工具已注册
let toolsRegistered = false;
function ensureToolsRegistered() {
  if (!toolsRegistered) {
    registerAllTools();
    toolsRegistered = true;
  }
}

class AgentController {
  /**
   * 处理 AI 对话请求
   */
  async chat(req: Request, res: Response) {
    try {
      ensureToolsRegistered();

      const { message, history, context, sessionId: clientSessionId } = req.body;
      const userId = (req as { userId?: string }).userId || 'anonymous';

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: '消息不能为空',
        });
      }

      // 使用前端传递的 sessionId，如果没有则生成新的
      const sessionId = clientSessionId || uuidv4();

      const response = await processAgentRequest({
        message,
        history: history || [],
        context,
        userId,
        sessionId,
      });

      // 返回 sessionId 给前端，以便后续请求使用
      return res.json({
        success: true,
        data: {
          ...response,
          sessionId, // 返回 sessionId
        },
      });
    } catch (error) {
      console.error('[Agent] 处理请求失败:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '处理请求失败',
      });
    }
  }

  /**
   * 确认并执行待处理的工具调用
   */
  async confirmTools(req: Request, res: Response) {
    try {
      ensureToolsRegistered();

      const { toolCalls } = req.body;
      const userId = (req as { userId?: string }).userId || 'anonymous';

      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        return res.status(400).json({
          success: false,
          error: '没有待执行的工具调用',
        });
      }

      const results = await confirmAndExecuteTools(toolCalls, userId);

      return res.json({
        success: true,
        data: { results },
      });
    } catch (error) {
      console.error('[Agent] 执行工具失败:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '执行工具失败',
      });
    }
  }

  /**
   * 获取 AI 服务状态
   */
  async status(_req: Request, res: Response) {
    try {
      ensureToolsRegistered();

      // 检查默认模型配置
      const defaultModel = await AiModel.findOne({ isDefault: true });

      if (!defaultModel) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: '未配置默认 AI 模型',
            toolCount: toolRegistry.getAll().length,
          },
        });
      }

      // 测试 LLM 连接
      try {
        const response = await fetch(`${defaultModel.baseUrl}/v1/models`, {
          method: 'GET',
          headers: {
            ...(defaultModel.apiKey && { 'Authorization': `Bearer ${defaultModel.apiKey}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({
            success: true,
            data: {
              available: true,
              provider: defaultModel.provider,
              model: defaultModel.model,
              url: defaultModel.baseUrl,
              models: data.data?.map((m: { id: string }) => m.id) || [],
              toolCount: toolRegistry.getAll().length,
            },
          });
        }
      } catch {
        // 连接失败
      }

      return res.json({
        success: true,
        data: {
          available: false,
          provider: defaultModel.provider,
          url: defaultModel.baseUrl,
          message: 'AI 服务不可用',
          toolCount: toolRegistry.getAll().length,
        },
      });
    } catch (error) {
      console.error('[Agent] 获取状态失败:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取状态失败',
      });
    }
  }

  /**
   * 获取可用工具列表
   */
  async getTools(_req: Request, res: Response) {
    try {
      ensureToolsRegistered();

      const tools = toolRegistry.getAll().map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        module: t.module,
        requiresConfirmation: t.requiresConfirmation,
      }));

      return res.json({
        success: true,
        data: { tools },
      });
    } catch (error) {
      console.error('[Agent] 获取工具列表失败:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取工具列表失败',
      });
    }
  }
}

export default new AgentController();

