# Story Snack - Design Spec

> AI 连载小说写作 + 自动投稿 + 短视频联动系统

## 1. 项目定位

一套 Claude Code Skill，实现：
- AI 每日自动生成连载小说章节（3000-4000 字）
- 半自动模式：AI 写作 → 人工审校确认 → 自动投稿
- 每章天然三段式结构（上/中/下），为短视频切分预留
- 首发平台：番茄小说（writer.fanqienovel.com）
- 开源发布到 GitHub

## 2. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   Story Snack                        │
├──────────┬──────────┬──────────┬─────────────────────┤
│  Bible   │ Writing  │ Quality  │    Publishing       │
│  System  │ Pipeline │ Gate     │    Pipeline          │
├──────────┼──────────┼──────────┼─────────────────────┤
│ 世界观   │ 案件生成  │ 反AI检测  │  番茄小说 MCP       │
│ 角色档案  │ 章节写作  │ 风格检查  │  (浏览器自动化)      │
│ 暗线大纲  │ 连续性审计│ 角色一致性│                     │
│ 线索管理  │ 状态更新  │ 线索校验  │                     │
└──────────┴──────────┴──────────┴─────────────────────┘
```

### 四大模块

### 2.1 Bible System（世界观系统）

借鉴 Claude-Book 的 bible 结构，一次性设定，后续只读。

```
bible/
├── style.md              # 写作风格指南（人称、语气、用词偏好、章节长度）
├── characters/
│   ├── protagonist.md    # 主角设定（性格、背景、口头禅、推理风格）
│   ├── sidekick.md       # 搭档/助手
│   └── recurring.md      # 常驻配角
├── universe/
│   ├── setting.md        # 时代背景、城市、核心场景
│   └── rules.md          # 世界观规则（推理逻辑、科技水平等）
└── arc/
    ├── master-arc.md     # 暗线主线大纲（大阴谋、最终 Boss）
    └── case-pool.md      # 预生成的案件梗概池（每个案件一句话概要）
```

### 2.2 Writing Pipeline（写作管道）

主骨架基于 Claude-Code-Novel-Writer 的多代理架构，针对单元剧做定制。

**6 个代理：**

| 代理 | 职责 | 输入 | 输出 |
|------|------|------|------|
| **case-architect** | 从案件池选取/生成当日案件，设计三幕结构 | bible/ + 已发布章节摘要 + 暗线进度 | 章节大纲（上/中/下三段） |
| **chapter-writer** | 按大纲写作完整章节（3000-4000字） | 章节大纲 + bible/style.md + 角色档案 | 章节草稿 |
| **clue-manager** | 管理线索系统：红鲱鱼、真线索、暗线伏笔 | 章节草稿 + 线索追踪文件 | 线索报告 + 更新追踪 |
| **continuity-editor** | 审计角色知识、时间线、世界观一致性 | 章节草稿 + state/ | 问题报告 + 修复建议 |
| **perplexity-improver** | 反 AI 检测改写（借鉴 Claude-Book） | 章节草稿 | 改写后的章节 |
| **state-updater** | 更新状态快照、时间线、角色知识 | 终稿 | state/chapter-NN/ |

**每日写作流程：**

```
读取 bible/ + state/current/ + 暗线进度
        ↓
  case-architect: 生成当日章节大纲
        ↓
  chapter-writer: 写作 3000-4000 字章节
        ↓
  clue-manager: 校验线索合理性
        ↓
  continuity-editor: 连续性审计
        ↓
  perplexity-improver: 反 AI 改写
        ↓
  ──── 人工审校确认 ────  ← 半自动：你在这里过目
        ↓
  state-updater: 更新状态
        ↓
  输出终稿到 manuscript/chapters/
```

### 2.3 Quality Gate（质量门）

#### 反 AI 检测（来自 Claude-Book）

6 种检测标准：
1. **低困惑度** — 句子 PPL < 22，太可预测
2. **低标准差** — 14 句窗口 σ < 14，语调单一
3. **连续低困惑** — 4+ 连续句子 PPL < 30
4. **低困惑密度** — 窗口内 >30% 句子低于 PPL 25
5. **禁用词** — AI 高频词汇（"delve"、"intricate" 等，需补充中文列表）
6. **低突发性** — 句子长度 σ < 5，节奏单调

9 种改写技巧：
1. 语言化采样（生成 3 个替代方案）
2. 句法倒装
3. 碎片化短句
4. 罕见词替换
5. 节奏破坏（长短句交替）
6. 感官细节注入
7. 角色语气注入
8. 反套路改写
9. 叙事省略

**中文适配**：需要针对中文建立禁用词表和困惑度阈值。

#### 悬疑专项检查
- 每章至少 2-3 条线索（1 真 + 1-2 假）
- 不能提前泄露真相
- 暗线伏笔与主线进度匹配
- 三段式结构完整性（上：悬念/案发，中：调查/误导，下：反转/真相）

### 2.4 Publishing Pipeline（发布管道）

#### 番茄小说 MCP（新建）

类似现有抖音 MCP 的架构，基于 Playwright 浏览器自动化。

**核心功能：**

| 工具 | 功能 |
|------|------|
| `fanqie_check_login` | 检查登录状态 |
| `fanqie_create_book` | 创建新作品（书名、简介、封面、分类） |
| `fanqie_publish_chapter` | 发布新章节（标题 + 正文） |
| `fanqie_check_review` | 检查审核状态 |
| `fanqie_screenshot` | 截图当前页面（调试用） |

**风险控制：**
- 模拟人类操作节奏（随机延迟）
- 不频繁登录/登出
- 每次发布前截图确认

## 3. 目录结构

```
story-snack/
├── CLAUDE.md                    # 主编排器（Orchestrator）
├── .claude/
│   ├── agents/
│   │   ├── case-architect.md    # 案件设计代理
│   │   ├── chapter-writer.md    # 章节写作代理
│   │   ├── clue-manager.md      # 线索管理代理
│   │   ├── continuity-editor.md # 连续性审计代理
│   │   ├── perplexity-improver.md # 反 AI 改写代理
│   │   └── state-updater.md     # 状态更新代理
│   ├── skills/
│   │   └── perplexity-improver/ # 反 AI 检测 skill
│   │       ├── SKILL.md
│   │       └── references/
│   │           └── rewriting-techniques-zh.md  # 中文改写技巧
│   └── settings.json            # Hook 配置
├── bible/                       # 世界观（只读）
│   ├── style.md
│   ├── characters/
│   ├── universe/
│   └── arc/
├── state/                       # 状态追踪（版本化）
│   ├── template/
│   ├── current -> chapter-NN/
│   └── chapter-NN/
├── timeline/
│   ├── history.md               # 全局时间线（只追加）
│   └── current-chapter.md       # 当前章节事件
├── clues/
│   ├── tracker.json             # 线索追踪（真/假/暗线）
│   └── arc-progress.json        # 暗线进度
├── manuscript/
│   ├── chapters/                # 终稿
│   │   ├── chapter-001.md
│   │   └── ...
│   └── summaries/               # 每章摘要（供后续章节参考）
├── scripts/
│   ├── detection/               # 反 AI 检测脚本
│   └── quality/                 # 质量检查脚本
├── mcp/
│   └── fanqie/                  # 番茄小说 MCP 服务
└── docs/
    └── specs/
```

## 4. 章节结构规范

每章 3000-4000 字，强制三段式：

```markdown
# 第 N 章：{章节标题}

## 上 · {小标题}（~1000-1300字）
悬念建立 / 案发现场 / 引入谜题
→ 对应视频 Part 1（1分钟）

## 中 · {小标题}（~1000-1300字）
调查推进 / 误导与反转 / 嫌疑人交锋
→ 对应视频 Part 2（1分钟）

## 下 · {小标题}（~1000-1300字）
真相揭晓 / 反转 / 暗线推进 / 下章钩子
→ 对应视频 Part 3（1分钟）
```

## 5. 每日工作流

```
┌─────────── 自动化 ───────────┐
│  1. 读取上下文               │
│  2. 生成案件大纲             │
│  3. 写作章节                 │
│  4. 质量门检查               │
│  5. 反 AI 改写               │
└──────────────────────────────┘
              ↓
       6. 通知你审校
       7. 你确认 ✓
              ↓
┌─────────── 自动化 ───────────┐
│  8. 更新状态                 │
│  9. 发布到番茄小说            │
│ 10. （后续）生成视频发抖音     │
└──────────────────────────────┘
```

## 6. 技术依赖

| 组件 | 技术 |
|------|------|
| AI 写作 | Claude (Opus/Sonnet) via Claude Code |
| 反 AI 检测 | 本地 LLM (Mistral-8B) + Python 困惑度分析 |
| 番茄投稿 | Playwright 浏览器自动化 (MCP) |
| 状态管理 | JSON + Markdown 文件 |
| 版本控制 | Git（每章一次 commit） |

## 7. 第一期范围（MVP）

先跑通核心流程，不追求完美：

- [x] Bible 系统搭建（世界观、角色、风格指南）
- [ ] case-architect + chapter-writer 两个核心代理
- [ ] 基础连续性检查（continuity-editor）
- [ ] 线索管理（clue-manager）
- [ ] 反 AI 改写（perplexity-improver，先用中文禁用词 + 基础规则）
- [ ] 番茄小说 MCP（登录 + 发布章节）
- [ ] 端到端跑通：生成第一章 → 审校 → 发布

**暂缓：**
- 困惑度本地 LLM 分析（先用规则 + Claude 自检）
- 视频生成联动
- 自动化定时触发

## 8. 开源计划

- 仓库名：`story-snack`
- 许可证：MIT
- README：中英双语
- 可扩展设计：悬疑推理作为默认模板，用户可替换 bible/ 适配其他题材
