# 🍿 Story Snack

**AI 连载小说写作 + 自动投稿系统**

> 每天一个故事，每个故事三口吃完。

---

## 这是什么？

Story Snack 是一套 Claude Code Skill，能够每天自动生成连载悬疑推理小说章节，并发布到[番茄小说](https://fanqienovel.com/main/writer)。每章天然三段式结构（上/中/下），天然适配三个 1 分钟视频，方便后续生成视频/短剧。

**核心能力：**

- 🤖 **6 个专业 AI 代理协作** — 案件设计、章节写作、线索追踪、连续性审计、反 AI 改写、状态管理
- 🕵️ **单元剧结构** — 每章一个独立案件，暗线贯穿全局，福尔摩斯式连载
- 🎬 **三幕章节**（3000-4000 字） — 上（悬念）→ 中（调查）→ 下（反转），每段对应 1 分钟短视频
- 🛡️ **反 AI 检测** — 80+ 中文禁用词 + 9 种改写技巧，让 AI 写的不像 AI 写的
- 🔄 **半自动工作流** — AI 写作 → 质量门 → 你审校 → 自动发布
- 📦 **逐章状态快照** — 角色知识、时间线、线索追踪、暗线进度，章章有据可查

## 工作原理

Story Snack 由四个模块组成：

- **世界观系统** — 角色档案、背景设定、暗线大纲、案件池。设定一次，后续只读。
- **写作管道** — 6 个 AI 代理接力：案件设计 → 章节写作 → 连续性审计 → 状态更新。
- **质量门** — 线索校验、角色一致性检查、反 AI 检测与改写，不达标不放行。
- **发布管道** — 基于 Playwright 的番茄小说 MCP，一键发布。

### 代理

| 代理                   | 职责                               | 模型   |
|-----------------------|------------------------------------|--------|
| `case-architect`      | 设计当日案件 + 三幕大纲               | sonnet |
| `chapter-writer`      | 写作完整章节（3000-4000 字）          | opus   |
| `clue-manager`        | 追踪真线索、红鲱鱼、暗线伏笔           | sonnet |
| `continuity-editor`   | 审计时间线、角色知识、世界观一致性       | sonnet |
| `perplexity-improver` | 改写 AI 痕迹明显的句子               | sonnet |
| `state-updater`       | 创建逐章状态快照                     | sonnet |

### Skill 指令

| 指令              | 功能                                         |
|-------------------|----------------------------------------------|
| `/fill-bible`     | 引导填充世界观设定（首次使用前必须运行）           |
| `/write-chapter`  | 执行每日写作管道                               |
| `/check-status`   | 查看当前章节号、暗线阶段、近 3 章摘要            |
| `/check-clues`    | 查看所有线索详情                               |
| `/publish`        | 发布最新章节到番茄小说                          |

### 每日工作流

```
🎯 case-architect → ✍️ chapter-writer → 🔍 clue-manager + continuity-editor
       → 🛡️ perplexity-improver → 👀 你审校 → 📦 state-updater → 🚀 发布
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/QQQingyu/story-snack.git
cd story-snack
```

### 2. 填充世界观设定

在项目目录下启动 Claude Code，使用 `/fill-bible` 指令，系统会引导你逐步完成：

```bash
claude
# 进入后输入 /fill-bible
```

你也可以直接编辑 `bible/` 下的模板文件：

```
bible/style.md                  # 写作风格指南（已预填，可按需调整）
bible/characters/protagonist.md # 主角设定
bible/characters/sidekick.md    # 搭档设定
bible/universe/setting.md       # 城市、时代、氛围
bible/universe/rules.md         # 推理规则（已预填）
bible/arc/master-arc.md         # 暗线大纲
bible/arc/case-pool.md          # 案件池（10-15 个案件梗概）
```

### 3. 写第一章

```bash
# 在 Claude Code 中输入
/write-chapter
```

编排器会引导你走完整套管道：案件设计 → 写作 → 质量门 → 反 AI 改写 → 审校 → 定稿。

### 4.（可选）配置番茄小说发布

```bash
cd mcp/fanqie && npm install && npm run build
```

然后在 Claude Code 中使用 `/publish` 发布。首次使用需要在浏览器中登录[番茄小说作者后台](https://fanqienovel.com/main/writer)。

## 适配其他题材

Story Snack 默认是悬疑推理，但可以适配任何小说题材：

1. **替换 `bible/`** — 修改角色、世界观、风格指南
2. **改造 `case-architect`** — 重命名为 `episode-architect`，调整大纲结构
3. **调整 `clue-manager`** — 非推理题材可改为「剧情线追踪器」
4. **其余代理不用动** — continuity-editor、perplexity-improver、state-updater 与题材无关

## 项目结构

```
story-snack/
├── CLAUDE.md                 # 主编排器
├── .claude/agents/           # 6 个专业代理
├── .claude/skills/           # Skill 指令 + 反 AI 检测
├── bible/                    # 世界观、角色、风格（设定后只读）
├── state/                    # 逐章状态快照
├── timeline/                 # 全局时间线（只追加）
├── clues/                    # 线索追踪 + 暗线进度
├── manuscript/               # 终稿 + 摘要
├── .work/                    # 临时工作文件
├── scripts/detection/        # 反 AI 检测资源
└── mcp/fanqie/              # 番茄小说自动发布 MCP
```

## 反 AI 检测系统

`perplexity-improver` 代理扫描章节中的 AI 痕迹并改写：

- **80+ 中文禁用词/短语** — AI 高频词汇表，出现即扣分
- **6 种模式检测** — 句式整齐、段落过于平衡、空洞描写、总结式收尾、情绪直述、对话后解释
- **9 种改写技巧** — 句法颠倒、碎片化、口语化注入、感官替换、节奏破坏、省略叙事、角色语气污染、反套路收尾、留白

## 致谢

灵感来源：

- [Claude-Code-Novel-Writer](https://github.com/forsonny/Claude-Code-Novel-Writer) — 多代理编排模式
- [Claude-Book](https://github.com/ThomasHoussin/Claude-Book) — 世界观系统、反 AI 检测、状态版本化

## 许可证

[MIT](LICENSE)
