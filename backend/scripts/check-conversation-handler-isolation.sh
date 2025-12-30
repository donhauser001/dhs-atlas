#!/bin/bash

# ============================================================================
# Conversation Handler 物理隔离检查脚本
# ============================================================================
# 
# 目的：确保 conversation-handler.ts 不会导入任何工具执行相关模块
# 
# 禁止导入列表：
# - ../tools/registry（工具注册表）
# - ../tools/executor（工具执行器）
# - ../../models/AiTool（工具模型）
# - ../../models/AiToolkit（工具模型别名）
# 
# 允许导入：
# - AiModel（用于调用 LLM）
# - AiMap（仅用于读取能力描述，不执行）
# - 类型定义
#
# 用法：
#   ./scripts/check-conversation-handler-isolation.sh
#
# 返回值：
#   0 - 检查通过
#   1 - 检查失败（发现违规导入）
#
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_FILE="$BACKEND_DIR/src/ai/agent/conversation-handler.ts"

echo "🔍 检查 Conversation Handler 物理隔离..."
echo "   目标文件: $TARGET_FILE"
echo ""

# 检查文件是否存在
if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ 错误: 目标文件不存在: $TARGET_FILE"
    exit 1
fi

# 定义禁止的导入模式
FORBIDDEN_PATTERNS=(
    "from.*['\"].*tools/registry['\"]"
    "from.*['\"].*tools/executor['\"]"
    "from.*['\"].*AiTool['\"]"
    "from.*['\"].*AiToolkit['\"]"
    "import.*registry.*from"
    "import.*executor.*from"
    "import.*toolRegistry"
    "import.*ToolExecutor"
)

VIOLATIONS=()

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if grep -E "$pattern" "$TARGET_FILE" > /dev/null 2>&1; then
        MATCH=$(grep -E "$pattern" "$TARGET_FILE")
        VIOLATIONS+=("$MATCH")
    fi
done

# 输出结果
if [ ${#VIOLATIONS[@]} -gt 0 ]; then
    echo "❌ 物理隔离检查失败！"
    echo ""
    echo "发现以下违规导入："
    echo "-----------------------------------"
    for violation in "${VIOLATIONS[@]}"; do
        echo "  ⚠️  $violation"
    done
    echo "-----------------------------------"
    echo ""
    echo "📋 根据 AI_EXECUTION_ARCHITECTURE.md 规范："
    echo "   Conversation Handler 必须与工具执行逻辑物理隔离。"
    echo "   禁止导入工具注册表、执行器或工具模型。"
    echo ""
    echo "💡 如果你需要在对话模式中读取系统能力信息："
    echo "   - 允许导入 AiMap（仅用于读取能力描述）"
    echo "   - 允许导入 AiModel（用于调用 LLM）"
    echo ""
    exit 1
else
    echo "✅ 物理隔离检查通过！"
    echo ""
    echo "   conversation-handler.ts 未导入任何禁止的工具模块。"
    exit 0
fi

