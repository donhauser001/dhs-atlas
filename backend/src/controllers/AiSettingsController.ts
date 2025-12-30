/**
 * AI 设置控制器
 */

import { Response } from 'express';
import axios from 'axios';
import AiModel, { IAiModel } from '../models/AiModel';

// 使用 any 类型的 Request 以避免与其他地方的 user 类型扩展冲突
type AuthRequest = any;

/**
 * 获取所有 AI 模型配置
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const getAllAiModels = async (req: AuthRequest, res: Response) => {
  try {
    // AI 设置是全局配置，直接查询所有模型
    const models = await AiModel.find({}).sort({ isDefault: -1, createdAt: -1 });

    // 添加 apiKeySet 字段
    const modelsWithApiKeyStatus = models.map((model) => ({
      ...model.toJSON(),
      apiKeySet: !!model.apiKey,
    }));

    res.json({ data: modelsWithApiKeyStatus });
  } catch (error) {
    console.error('获取 AI 模型列表失败:', error);
    res.status(500).json({ error: '获取 AI 模型列表失败' });
  }
};

/**
 * 获取单个 AI 模型配置
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const getAiModel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const model = await AiModel.findById(id);
    if (!model) {
      return res.status(404).json({ error: 'AI 模型不存在' });
    }

    return res.json({
      data: {
        ...model.toJSON(),
        apiKeySet: !!model.apiKey,
      },
    });
  } catch (error) {
    console.error('获取 AI 模型失败:', error);
    return res.status(500).json({ error: '获取 AI 模型失败' });
  }
};

/**
 * 创建 AI 模型配置
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const createAiModel = async (req: AuthRequest, res: Response) => {
  try {
    const { name, provider, model, apiKey, baseUrl, temperature, maxTokens, topP, isDefault, isEnabled } = req.body;

    // 如果设为默认，先取消其他默认（全局）
    if (isDefault) {
      await AiModel.updateMany({ isDefault: true }, { isDefault: false });
    }

    const newModel = new AiModel({
      name,
      provider,
      model,
      apiKey,
      baseUrl,
      temperature,
      maxTokens,
      topP,
      isDefault,
      isEnabled,
      // 不再设置 enterpriseId，AI 设置是全局的
    });

    await newModel.save();

    res.status(201).json({
      data: {
        ...newModel.toJSON(),
        apiKeySet: !!newModel.apiKey,
      },
    });
  } catch (error) {
    console.error('创建 AI 模型失败:', error);
    res.status(500).json({ error: '创建 AI 模型失败' });
  }
};

/**
 * 更新 AI 模型配置
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const updateAiModel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, provider, model, apiKey, baseUrl, temperature, maxTokens, topP, isDefault, isEnabled } = req.body;

    const existingModel = await AiModel.findById(id).select('+apiKey');
    if (!existingModel) {
      return res.status(404).json({ error: 'AI 模型不存在' });
    }

    // 如果设为默认，先取消其他默认（全局）
    if (isDefault && !existingModel.isDefault) {
      await AiModel.updateMany({ isDefault: true, _id: { $ne: id } }, { isDefault: false });
    }

    // 更新字段
    if (name !== undefined) existingModel.name = name;
    if (provider !== undefined) existingModel.provider = provider;
    if (model !== undefined) existingModel.model = model;
    if (apiKey) existingModel.apiKey = apiKey; // 只有传入新 key 才更新
    if (baseUrl !== undefined) existingModel.baseUrl = baseUrl;
    if (temperature !== undefined) existingModel.temperature = temperature;
    if (maxTokens !== undefined) existingModel.maxTokens = maxTokens;
    if (topP !== undefined) existingModel.topP = topP;
    if (isDefault !== undefined) existingModel.isDefault = isDefault;
    if (isEnabled !== undefined) existingModel.isEnabled = isEnabled;

    await existingModel.save();

    return res.json({
      data: {
        ...existingModel.toJSON(),
        apiKeySet: !!existingModel.apiKey,
      },
    });
  } catch (error) {
    console.error('更新 AI 模型失败:', error);
    return res.status(500).json({ error: '更新 AI 模型失败' });
  }
};

/**
 * 删除 AI 模型配置
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const deleteAiModel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const model = await AiModel.findByIdAndDelete(id);
    if (!model) {
      return res.status(404).json({ error: 'AI 模型不存在' });
    }

    return res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除 AI 模型失败:', error);
    return res.status(500).json({ error: '删除 AI 模型失败' });
  }
};

/**
 * 设置默认模型
 * 注意：AI 设置是全局配置，不按企业隔离
 */
export const setDefaultModel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 取消所有默认（全局）
    await AiModel.updateMany({}, { isDefault: false });

    // 设置新默认
    const model = await AiModel.findByIdAndUpdate(id, { isDefault: true }, { new: true });

    if (!model) {
      return res.status(404).json({ error: 'AI 模型不存在' });
    }

    return res.json({ data: model });
  } catch (error) {
    console.error('设置默认模型失败:', error);
    return res.status(500).json({ error: '设置默认模型失败' });
  }
};

/**
 * 测试模型连接
 */
export const testConnection = async (req: AuthRequest, res: Response) => {
  try {
    const { provider, model, apiKey, baseUrl } = req.body;

    const startTime = Date.now();
    let success = false;
    let message = '';

    // 根据提供商进行不同的测试
    switch (provider) {
      case 'ollama':
        try {
          const ollamaUrl = baseUrl || 'http://localhost:11434';
          await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
          success = true;
          message = 'Ollama 服务连接成功';
        } catch {
          message = 'Ollama 服务连接失败';
        }
        break;

      case 'lmstudio':
        try {
          const lmstudioUrl = baseUrl || 'http://localhost:1234';
          await axios.get(`${lmstudioUrl}/v1/models`, { timeout: 5000 });
          success = true;
          message = 'LMStudio 服务连接成功';
        } catch {
          message = 'LMStudio 服务连接失败';
        }
        break;

      case 'openai':
      case 'deepseek':
      case 'moonshot':
      case 'qwen':
      case 'zhipu':
      case 'custom':
        try {
          const apiUrl = baseUrl || 'https://api.openai.com/v1';
          await axios.get(`${apiUrl}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          });
          success = true;
          message = '连接成功';
        } catch (error: any) {
          if (error.response?.status === 401) {
            message = 'API Key 无效';
          } else {
            message = '连接失败: ' + (error.message || '未知错误');
          }
        }
        break;

      default:
        message = '暂不支持测试该提供商';
    }

    const responseTime = Date.now() - startTime;

    res.json({
      data: {
        success,
        message,
        responseTime,
        modelInfo: success ? { name: model } : undefined,
      },
    });
  } catch (error) {
    console.error('测试连接失败:', error);
    res.status(500).json({ error: '测试连接失败' });
  }
};

/**
 * 获取 Ollama 本地模型列表
 */
export const getOllamaModels = async (req: AuthRequest, res: Response) => {
  try {
    const baseUrl = (req.query.baseUrl as string) || 'http://localhost:11434';

    const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
    const models = response.data?.models || [];

    res.json({ data: models });
  } catch (error) {
    console.error('获取 Ollama 模型列表失败:', error);
    res.status(500).json({ error: '无法连接到 Ollama 服务' });
  }
};

/**
 * 获取 LMStudio 本地模型列表
 */
export const getLMStudioModels = async (req: AuthRequest, res: Response) => {
  try {
    const baseUrl = (req.query.baseUrl as string) || 'http://localhost:1234';

    const response = await axios.get(`${baseUrl}/v1/models`, { timeout: 5000 });
    const models = response.data?.data || [];

    res.json({ data: models });
  } catch (error) {
    console.error('获取 LMStudio 模型列表失败:', error);
    res.status(500).json({ error: '无法连接到 LMStudio 服务' });
  }
};

