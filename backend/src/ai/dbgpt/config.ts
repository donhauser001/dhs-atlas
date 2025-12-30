/**
 * DB-GPT 配置
 * 
 * 通过环境变量控制是否使用 DB-GPT
 */

export interface AIServiceConfig {
    /** 是否使用 DB-GPT 作为 AI 后端 */
    useDBGPT: boolean;
    /** DB-GPT 服务地址 */
    dbgptBaseUrl: string;
    /** DB-GPT 模型名称 */
    dbgptModel: string;
    /** 是否使用 DB-GPT Agent（更高级，但需要 DB-GPT 服务运行） */
    useDBGPTAgent: boolean;
}

/**
 * 获取 AI 服务配置
 */
export function getAIServiceConfig(): AIServiceConfig {
    return {
        // USE_DBGPT=true 启用 DB-GPT/LMStudio 作为 LLM 后端
        useDBGPT: process.env.USE_DBGPT === 'true',
        
        // LLM 服务地址
        // - LMStudio 直连: http://192.168.31.177:1234 (推荐，更简单)
        // - DB-GPT 模式: http://localhost:5670 (需要启动 DB-GPT webserver)
        dbgptBaseUrl: process.env.DBGPT_BASE_URL || 'http://192.168.31.177:1234',
        
        // 使用的模型
        dbgptModel: process.env.DBGPT_MODEL || 'qwen/qwen3-coder-30b',
        
        // 是否使用 DB-GPT 的 Agent 系统（而不仅仅是 LLM）
        // USE_DBGPT_AGENT=true 启用完整的 Agent 替换
        useDBGPTAgent: process.env.USE_DBGPT_AGENT === 'true',
    };
}

/**
 * 打印当前 AI 服务配置
 */
export function logAIServiceConfig(): void {
    const config = getAIServiceConfig();
    console.log('[AI Service] 配置:');
    console.log(`  - 使用 DB-GPT: ${config.useDBGPT ? '是' : '否'}`);
    if (config.useDBGPT) {
        console.log(`  - DB-GPT 地址: ${config.dbgptBaseUrl}`);
        console.log(`  - DB-GPT 模型: ${config.dbgptModel}`);
        console.log(`  - 使用 DB-GPT Agent: ${config.useDBGPTAgent ? '是' : '否'}`);
    }
}

