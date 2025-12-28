/**
 * AI 聊天 API 路由
 * 
 * 处理前端 AI Panel 的聊天请求，转发到配置的 LLM 服务
 */

import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import AiModel from '../models/AiModel';

const router = Router();

// LMStudio 默认配置
const DEFAULT_LMSTUDIO_URL = 'http://192.168.31.178:1234';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * POST /api/ai/chat
 * 发送聊天消息到 AI 模型
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, model, temperature = 0.7, max_tokens = 4096 } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '消息列表不能为空',
      });
    }

    // 获取企业 ID（从认证的用户获取）
    const enterpriseId = (req as any).user?.enterpriseId;

    // 查找默认 AI 模型配置
    let aiModel = null;
    if (enterpriseId) {
      aiModel = await AiModel.findOne({
        enterpriseId,
        isDefault: true,
        isEnabled: true,
      });

      // 如果没有默认模型，使用任何可用的模型
      if (!aiModel) {
        aiModel = await AiModel.findOne({
          enterpriseId,
          isEnabled: true,
        });
      }
    }

    // 确定使用的 API 端点
    let apiUrl = DEFAULT_LMSTUDIO_URL;
    let modelName = model || 'qwen/qwen3-coder-30b';
    let apiKey: string | undefined;

    if (aiModel) {
      apiUrl = aiModel.baseUrl || DEFAULT_LMSTUDIO_URL;
      modelName = aiModel.model || modelName;
      // 注意：API Key 默认不返回，需要显式选择
      if (aiModel.apiKeySet) {
        const fullModel = await AiModel.findById(aiModel._id).select('+apiKey');
        apiKey = fullModel?.apiKey;
      }
    }

    console.log(`[AI Chat] 使用模型: ${modelName} @ ${apiUrl}`);

    // 调用 LLM API (OpenAI 兼容格式)
    const response = await axios.post(
      `${apiUrl}/v1/chat/completions`,
      {
        model: modelName,
        messages,
        temperature: aiModel?.temperature ?? temperature,
        max_tokens: aiModel?.maxTokens ?? max_tokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        },
        timeout: 60000, // 60 秒超时
      }
    );

    const result = response.data;
    const assistantMessage = result.choices?.[0]?.message?.content || '';

    res.status(200).json({
      success: true,
      data: {
        content: assistantMessage,
        model: modelName,
        usage: result.usage,
      },
    });
  } catch (error: any) {
    console.error('[AI Chat] 错误:', error.message);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI 服务不可用，请检查 LMStudio 是否正在运行',
        });
      }
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: error.response.data?.error?.message || 'AI 服务返回错误',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: '调用 AI 服务时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/ai/status
 * 检查 AI 服务状态
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // 检查 LMStudio 是否可用
    const response = await axios.get(`${DEFAULT_LMSTUDIO_URL}/v1/models`, {
      timeout: 5000,
    });

    const models = response.data?.data || [];

    res.status(200).json({
      success: true,
      data: {
        available: true,
        provider: 'lmstudio',
        url: DEFAULT_LMSTUDIO_URL,
        models: models.map((m: any) => m.id),
      },
    });
  } catch {
    res.status(200).json({
      success: true,
      data: {
        available: false,
        provider: 'lmstudio',
        url: DEFAULT_LMSTUDIO_URL,
        error: 'AI 服务不可用',
      },
    });
  }
});

export default router;

