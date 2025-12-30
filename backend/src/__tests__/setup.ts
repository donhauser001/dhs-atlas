/**
 * Jest 测试全局设置
 */

// 增加测试超时时间
jest.setTimeout(30000);

// 全局 afterAll 钩子 - 确保测试结束后关闭所有连接
afterAll(async () => {
    // 等待所有异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
});

// 抑制控制台日志（可选）
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
// };

