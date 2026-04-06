# Story Snack

AI 连载小说写作框架。通过多代理协作，完成从世界观设定到每日章节生成的完整写作管道。

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
  bible/arc/case-pool.md
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

### 3. 生成 CLAUDE.md

将本仓库根目录的 `CLAUDE.md` 复制到作品目录。

### 4. 安装代理和技能

将本仓库的 `agents/` 和 `skills/` 复制到作品目录的 `.claude/` 下：

```
{作品名}/.claude/agents/     ← 复制自本仓库 agents/
{作品名}/.claude/skills/     ← 复制自本仓库 skills/
```

### 5. 引导填充世界观

引导运行 `/fill-bible`，逐步填充角色、世界观、暗线等设定。

## 代理清单

| 代理 | 职责 | 推荐模型 |
|------|------|----------|
| case-architect | 设计当日案件和三幕大纲 | sonnet |
| chapter-writer | 写作完整章节（3000-4000 字） | opus |
| clue-manager | 线索追踪和校验 | sonnet |
| continuity-editor | 连续性审计 | sonnet |
| perplexity-improver | 反 AI 改写 | sonnet |
| state-updater | 状态更新和归档 | sonnet |

## 可用技能

| 技能 | 触发方式 | 功能 |
|------|----------|------|
| write-chapter | `/write-chapter` 或 "写今天的章节" | 执行完整写作管道 |
| fill-bible | `/fill-bible` 或 "填充设定" | 引导填充世界观 |
| check-status | `/check-status` 或 "查看进度" | 查看当前章节号和暗线阶段 |
| check-clues | `/check-clues` 或 "查看线索" | 查看所有线索详情 |
| publish | `/publish` 或 "发布" | 发布到番茄小说 |
| perplexity-improver | `/perplexity-improver` | 反 AI 痕迹改写 |

## 每日写作管道

完整的一章写作流程（由 `/write-chapter` 触发）：

1. **准备** — 读取进度，确定章节号，简报当前状态
2. **案件设计** — 调用 case-architect 生成大纲，用户确认
3. **写作** — 调用 chapter-writer 生成初稿
4. **质量门** — 并行调用 clue-manager + continuity-editor 检查
5. **反 AI 改写** — 调用 perplexity-improver 降低 AI 痕迹
6. **人工审校** — 用户审阅并确认
7. **定稿** — 调用 state-updater 更新状态并归档
8. **发布（可选）** — 调用 publish 发布到平台

## MCP 配置（可选）

框架包含番茄小说发布 MCP（`mcp/fanqie/`）。如需使用：

1. `cd mcp/fanqie && npm install && npm run build`
2. 在 `.claude/mcp.json` 中配置：
```json
{
  "mcpServers": {
    "fanqie": {
      "command": "node",
      "args": ["{作品目录}/mcp/fanqie/dist/index.js"]
    }
  }
}
```

## 项目结构说明

作品目录中各文件夹的职责：

| 目录 | 职责 | 读写规则 |
|------|------|----------|
| bible/ | 世界观和角色设定 | 填充后只读 |
| state/ | 状态快照，每章一个目录 | state-updater 维护 |
| timeline/ | 全局时间线 | 只追加 |
| clues/ | 线索追踪和暗线进度 | clue-manager 维护 |
| manuscript/ | 终稿和摘要 | 定稿时写入 |
| .work/ | 临时工作文件 | 随时读写 |
| scripts/ | 质量检测脚本 | 只读 |
