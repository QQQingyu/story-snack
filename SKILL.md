# Story Snack

AI 连载小说写作框架。通过多代理协作，完成从世界观设定到每日章节生成的完整写作管道。支持任意题材，题材细节在引导流程中由用户确定。

兼容所有支持 Skills 的 Bash Agent（Claude Code、OpenClaw、Cursor、Trae 等）。

## 创建新作品

收到创建新小说的请求时，按以下步骤执行：

### 1. 创建项目目录

在当前目录下创建以小说名命名的文件夹。

### 2. 生成项目结构

将本仓库 `templates/` 下的所有文件复制到作品目录根部：

```
{作品名}/
  bible/style.md
  bible/characters/protagonist.md
  bible/characters/sidekick.md
  bible/characters/recurring.md
  bible/arc/master-arc.md
  bible/arc/event-pool.md
  bible/universe/setting.md
  bible/universe/rules.md
  clues/arc-progress.json
  clues/tracker.json
  state/template/characters.md
  state/template/clues.md
  state/template/knowledge.md
  state/template/situation.md
  timeline/current-chapter.md
  timeline/history.md
  scripts/detection/forbidden_words_zh.txt
```

### 3. 安装编排器和代理

将本仓库的 `RULES.md`、`agents/`、`skills/` 复制到作品目录：

```
{作品名}/
  RULES.md               ← 复制自本仓库 RULES.md（编排器指令）
  agents/                 ← 复制自本仓库 agents/（代理角色定义）
  skills/                 ← 复制自本仓库 skills/（技能定义）
```

### 4. 安装番茄小说发布 MCP

将本仓库 `mcp/fanqie/` 复制到作品目录，构建并配置：

```bash
cp -r {本仓库}/mcp/ {作品名}/mcp/
cd {作品名}/mcp/fanqie && npm install && npm run build
```

### 5. 生成 Agent 配置文件

根据用户使用的 Agent 平台，将 `RULES.md` 和 MCP 配置安装到对应位置：

| Agent 平台 | 编排器配置 | MCP 配置 |
|-----------|---------|---------|
| **Claude Code** | 复制为 `CLAUDE.md`；`agents/` `skills/` 也复制到 `.claude/` 下 | 创建 `.claude/mcp.json`（见下方） |
| **Cursor** | 复制为 `.cursor/rules/story-snack.md` | 按 Cursor MCP 文档配置 |
| **Trae** | 复制为 `.trae/rules/story-snack.md` | 按 Trae MCP 文档配置 |
| **OpenClaw** | `RULES.md` 已就位 | 按平台 MCP 文档配置 |

**Claude Code MCP 配置**：在 `{作品名}/.claude/mcp.json` 中写入（使用作品目录的绝对路径）：

```json
{
  "mcpServers": {
    "fanqie": {
      "command": "node",
      "args": ["{作品目录绝对路径}/mcp/fanqie/dist/index.js"]
    }
  }
}
```

如果无法确定用户使用的平台，优先生成 `RULES.md`（通用），并询问是否需要为特定平台创建额外配置。

### 6. 引导填充世界观

引导运行 `/fill-bible`，逐步填充题材、角色、世界观、主弧等设定。

## 代理清单

| 代理 | 职责 | 推荐模型 |
|------|------|----------|
| chapter-architect | 设计章节核心事件和三幕大纲 | sonnet |
| chapter-writer | 写作完整章节（3000-4000 字） | opus |
| narrative-tracker | 叙事线追踪和校验 | sonnet |
| continuity-editor | 连续性审计 | sonnet |
| perplexity-improver | 反 AI 改写 | sonnet |
| state-updater | 状态更新和归档 | sonnet |

代理定义存放在 `agents/` 目录，每个代理是一个独立的 Markdown 文件，包含角色描述、工作流程和输出格式。Agent 平台应将其作为子代理的 system prompt 使用。

## 可用技能

| 技能 | 触发方式 | 功能 |
|------|----------|------|
| write-chapter | `/write-chapter` 或 "写今天的章节" | 执行完整写作管道 |
| fill-bible | `/fill-bible` 或 "填充设定" | 引导填充世界观（含题材选择） |
| check-status | `/check-status` 或 "查看进度" | 查看当前章节号和主弧阶段 |
| check-threads | `/check-threads` 或 "查看叙事线" | 查看所有叙事线详情 |
| publish | `/publish` 或 "发布" | 发布到番茄小说 |
| perplexity-improver | `/perplexity-improver` | 反 AI 痕迹改写 |

技能定义存放在 `skills/` 目录。

## 每日写作管道

完整的一章写作流程（由 `/write-chapter` 触发）：

1. **准备** — 读取进度，确定章节号，简报当前状态
2. **章节设计** — 调用 chapter-architect 生成大纲，用户确认
3. **写作** — 调用 chapter-writer 生成初稿
4. **质量门** — 并行调用 narrative-tracker + continuity-editor 检查
5. **反 AI 改写** — 调用 perplexity-improver 降低 AI 痕迹
6. **人工审校** — 用户审阅并确认
7. **定稿** — 调用 state-updater 更新状态并归档
8. **发布（可选）** — 调用 publish 发布到平台

## 项目结构说明

作品目录中各文件夹的职责：

| 目录 | 职责 | 读写规则 |
|------|------|----------|
| agents/ | 代理角色定义 | 只读 |
| skills/ | 技能定义 | 只读 |
| mcp/fanqie/ | 番茄小说发布 MCP 服务器 | 只读（构建产物） |
| bible/ | 世界观和角色设定 | 填充后只读 |
| state/ | 状态快照，每章一个目录 | state-updater 维护 |
| timeline/ | 全局时间线 | 只追加 |
| clues/ | 叙事线追踪和主弧进度 | narrative-tracker 维护 |
| manuscript/ | 终稿和摘要 | 定稿时写入 |
| .work/ | 临时工作文件 | 随时读写 |
| scripts/ | 质量检测脚本 | 只读 |
