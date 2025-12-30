"""
DHS-Atlas Agent 入口

启动方式：
1. 命令行测试：python -m dhs_atlas_agent.main --cli
2. API 服务：python -m dhs_atlas_agent.main --api
"""

import asyncio
import argparse
import sys


def run_cli():
    """运行命令行交互模式"""
    from dhs_atlas_agent.models import connect_db
    from dhs_atlas_agent.agents import DHSAtlasAgent
    
    print("=" * 50)
    print("DHS-Atlas AI Agent - 命令行模式")
    print("=" * 50)
    print("输入 'exit' 或 'quit' 退出")
    print("输入 'clear' 清除会话")
    print()
    
    # 连接数据库
    connect_db()
    
    # 创建 Agent
    agent = DHSAtlasAgent()
    session_id = "cli_session"
    
    async def chat_loop():
        while True:
            try:
                user_input = input("\n你: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ("exit", "quit"):
                    print("再见！")
                    break
                
                if user_input.lower() == "clear":
                    agent.clear_session(session_id)
                    print("会话已清除")
                    continue
                
                print("\n鲁班: ", end="", flush=True)
                
                response = await agent.chat(
                    message=user_input,
                    session_id=session_id,
                )
                
                print(response.content)
            
            except KeyboardInterrupt:
                print("\n再见！")
                break
            except Exception as e:
                print(f"\n错误: {e}")
    
    asyncio.run(chat_loop())


def run_api():
    """运行 API 服务"""
    from dhs_atlas_agent.api.server import main
    main()


def run_test():
    """运行简单测试"""
    from dhs_atlas_agent.models import connect_db, ClientModel, QuotationModel
    from dhs_atlas_agent.tools.finance import query_client_quotation
    
    print("=" * 50)
    print("DHS-Atlas Agent - 测试模式")
    print("=" * 50)
    
    # 连接数据库
    connect_db()
    
    # 测试 1: 查询客户
    print("\n[测试 1] 搜索客户...")
    clients = ClientModel.search(limit=3)
    print(f"  找到 {len(clients)} 个客户")
    for c in clients:
        print(f"  - {c.name} ({c.category})")
    
    # 测试 2: 查询客户报价单
    if clients:
        client_name = clients[0].name
        print(f"\n[测试 2] 查询客户报价单: {client_name}")
        result = query_client_quotation(client_name)
        
        if result.get("client"):
            print(f"  客户: {result['client']['name']}")
        if result.get("quotation"):
            print(f"  报价单: {result['quotation']['name']}")
        if result.get("services"):
            print(f"  服务数量: {len(result['services'])}")
        if result.get("message"):
            print(f"  消息: {result['message']}")
    
    print("\n测试完成！")


def main():
    """主入口"""
    parser = argparse.ArgumentParser(description="DHS-Atlas AI Agent")
    parser.add_argument("--cli", action="store_true", help="运行命令行交互模式")
    parser.add_argument("--api", action="store_true", help="运行 API 服务")
    parser.add_argument("--test", action="store_true", help="运行测试")
    
    args = parser.parse_args()
    
    if args.cli:
        run_cli()
    elif args.api:
        run_api()
    elif args.test:
        run_test()
    else:
        # 默认运行 API
        print("使用 --cli 运行命令行模式，--api 运行 API 服务，--test 运行测试")
        print("默认启动 API 服务...")
        run_api()


if __name__ == "__main__":
    main()

