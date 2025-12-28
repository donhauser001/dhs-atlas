import { Router, Request, Response } from 'express';
import { exec } from 'child_process';

const router = Router();

// 可执行的命令白名单
const ALLOWED_COMMANDS = {
  'rebuild-frontend': 'rebuild-frontend',
  'quick-start': 'quick-start'
};

// 执行脚本 API
router.post('/run-script', async (req: Request, res: Response) => {
  try {
    const { scriptName } = req.body;

    if (!scriptName || !ALLOWED_COMMANDS[scriptName as keyof typeof ALLOWED_COMMANDS]) {
      return res.status(400).json({
        success: false,
        error: '无效的脚本名称',
        allowedScripts: Object.keys(ALLOWED_COMMANDS)
      });
    }
    
    console.log(`🔧 开始执行: ${scriptName}`);
    
    // 使用 docker 命令直接操作容器（通过挂载的 docker.sock）
    // 注意：由于容器内没有源代码目录，无法执行 build，只能重启容器
    let command = '';
    
    if (scriptName === 'rebuild-frontend') {
      // 重启前端容器
      command = `docker restart donhauser-frontend`;
    } else if (scriptName === 'quick-start') {
      // 重启所有服务容器（注意：这会重启后端自己，所以响应可能中断）
      command = `docker restart donhauser-frontend donhauser-backend`;
    }

    // 异步执行，不等待完成
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 执行错误: ${error.message}`);
        console.error(`stderr: ${stderr}`);
      } else {
        console.log(`✅ 执行完成: ${scriptName}`);
        console.log(`stdout: ${stdout}`);
      }
    });

    // 立即返回，不等待执行完成
    res.json({
      success: true,
      message: `${scriptName} 已开始执行`,
      note: scriptName === 'quick-start' 
        ? '⚠️ 所有服务正在重启，请等待约10秒后刷新页面'
        : '⚠️ 前端正在重启，请等待约5秒后刷新页面'
    });

  } catch (error) {
    console.error('执行失败:', error);
    res.status(500).json({
      success: false,
      error: '执行失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取可用脚本列表
router.get('/scripts', (req: Request, res: Response) => {
  res.json({
    success: true,
    scripts: [
      {
        name: 'rebuild-frontend',
        description: '重启前端容器',
        warning: '前端将暂时不可用约5秒'
      },
      {
        name: 'quick-start',
        description: '重启前后端服务',
        warning: '所有服务将重启约10秒'
      }
    ]
  });
});

export default router;

