# Story Snack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code skill that generates daily serialized mystery chapters (3000-4000 words, three-act structure) and publishes to Fanqie Novel platform, with anti-AI detection and continuity management.

**Architecture:** Multi-agent orchestrator pattern. CLAUDE.md acts as the master orchestrator, delegating to 6 specialized agents (case-architect, chapter-writer, clue-manager, continuity-editor, perplexity-improver, state-updater). Bible system provides read-only world/character/style context. State is versioned per chapter. Fanqie publishing via Playwright MCP.

**Tech Stack:** Claude Code agents (Markdown), Python (anti-AI detection scripts), Playwright + Node.js (Fanqie MCP), JSON/Markdown (state management), Git (version control)

**Reference Projects:**
- `/Users/qingyu/Claude-Code-Novel-Writer/` — orchestrator pattern, agent structure, automation hooks
- `/Users/qingyu/Claude-Book/` — bible system, perplexity-improver, state versioning, reviewer agents

---

## File Structure

```
story-snack/
├── CLAUDE.md                              # Master orchestrator
├── .claude/
│   ├── agents/
│   │   ├── case-architect.md              # Daily case design + 3-act outline
│   │   ├── chapter-writer.md              # Full chapter writing (3000-4000 words)
│   │   ├── clue-manager.md                # Clue tracking + validation
│   │   ├── continuity-editor.md           # Timeline/character/world consistency
│   │   ├── perplexity-improver.md         # Anti-AI rewriting agent
│   │   └── state-updater.md               # Per-chapter state snapshots
│   ├── skills/
│   │   └── perplexity-improver/
│   │       ├── SKILL.md                   # Anti-AI detection skill
│   │       └── references/
│   │           └── rewriting-techniques-zh.md  # Chinese rewriting techniques
│   └── settings.json                      # Hook configuration
├── bible/                                 # Read-only world context
│   ├── style.md                           # Writing style guide
│   ├── characters/
│   │   ├── protagonist.md
│   │   ├── sidekick.md
│   │   └── recurring.md
│   ├── universe/
│   │   ├── setting.md
│   │   └── rules.md
│   └── arc/
│       ├── master-arc.md
│       └── case-pool.md
├── state/
│   ├── template/
│   │   ├── situation.md
│   │   ├── characters.md
│   │   ├── knowledge.md
│   │   └── clues.md
│   └── current -> chapter-001/            # Symlink to latest
├── timeline/
│   ├── history.md
│   └── current-chapter.md
├── clues/
│   ├── tracker.json
│   └── arc-progress.json
├── manuscript/
│   ├── chapters/
│   └── summaries/
├── .work/                                 # Temporary working files
├── scripts/
│   └── detection/
│       ├── detect_ai_zh.py                # Chinese AI detection
│       └── forbidden_words_zh.txt         # Chinese AI-signal word list
├── mcp/
│   └── fanqie/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts                   # MCP server entry
│       │   ├── tools/
│       │   │   ├── check-login.ts
│       │   │   ├── create-book.ts
│       │   │   ├── publish-chapter.ts
│       │   │   ├── check-review.ts
│       │   │   └── screenshot.ts
│       │   └── browser.ts                 # Playwright browser management
│       └── tsconfig.json
└── docs/
    └── specs/
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: All directories listed above
- Create: `state/template/situation.md`
- Create: `state/template/characters.md`
- Create: `state/template/knowledge.md`
- Create: `state/template/clues.md`
- Create: `timeline/history.md`
- Create: `timeline/current-chapter.md`
- Create: `clues/tracker.json`
- Create: `clues/arc-progress.json`

- [ ] **Step 1: Create directory structure**

```bash
cd /Users/qingyu/story-snack
mkdir -p .claude/agents
mkdir -p .claude/skills/perplexity-improver/references
mkdir -p bible/characters bible/universe bible/arc
mkdir -p state/template
mkdir -p timeline
mkdir -p clues
mkdir -p manuscript/chapters manuscript/summaries
mkdir -p .work
mkdir -p scripts/detection
mkdir -p mcp/fanqie/src/tools
mkdir -p docs/specs
```

- [ ] **Step 2: Create state templates**

`state/template/situation.md`:
```markdown
# 当前局势

## 时间
（章节内的日期/时间）

## 地点
（主角当前所在位置）

## 正在发生的事
（当前案件状态、进展）

## 主角状态
（身体状况、情绪、目标）
```

`state/template/characters.md`:
```markdown
# 角色状态

## 主角
- 身体状况：
- 情绪状态：
- 当前目标：
- 与其他角色关系变化：

## 搭档
- 身体状况：
- 情绪状态：
- 当前目标：

## 本章出场配角
（列出本章出场的非主角角色及其状态）
```

`state/template/knowledge.md`:
```markdown
# 角色知识

## 主角已知信息
（主角在故事中获知的所有关键信息，按章节累积）

## 主角未知信息
（读者知道但主角不知道的信息——悬念来源）

## 搭档已知信息
（搭档知道的信息，可能与主角有差异）
```

`state/template/clues.md`:
```markdown
# 本章线索

## 真线索
（推动真相揭露的线索）

## 红鲱鱼
（误导性线索）

## 暗线伏笔
（与主线大阴谋相关的伏笔）
```

- [ ] **Step 3: Create initial tracking files**

`timeline/history.md`:
```markdown
# 全局时间线

<!-- 只追加，不修改。每章结束后由 state-updater 追加事件。 -->
```

`timeline/current-chapter.md`:
```markdown
# 当前章节事件

<!-- 每章开始时清空，写作过程中记录本章事件。 -->
```

`clues/tracker.json`:
```json
{
  "real_clues": [],
  "red_herrings": [],
  "arc_foreshadowing": [],
  "resolved": []
}
```

`clues/arc-progress.json`:
```json
{
  "current_chapter": 0,
  "master_arc_phase": "setup",
  "arc_clues_planted": [],
  "arc_clues_revealed": [],
  "tension_level": 0
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "scaffold: create project directory structure and state templates"
```

---

## Task 2: Bible System — Style Guide

**Files:**
- Create: `bible/style.md`

- [ ] **Step 1: Write style guide**

`bible/style.md`:
```markdown
# 写作风格指南

## 基本参数
- **人称**：第三人称有限视角（紧跟主角）
- **时态**：过去时
- **每章字数**：3000-4000 字
- **章节结构**：强制三段式（上/中/下），每段 1000-1300 字

## 语言风格
- 简洁利落，不堆砌形容词
- 对话占比 30-40%，推动剧情而非装饰
- 推理段落逻辑严密，线索自然嵌入叙事
- 案发现场描写注重感官细节（视觉、听觉、嗅觉、触觉）
- 避免说教式总结，让读者自己拼凑真相

## 节奏控制
- 上篇（悬念建立）：快节奏切入，前 3 句内抛出悬念或异常
- 中篇（调查推进）：对话与内心推理交替，穿插误导
- 下篇（真相揭晓）：加速收束，反转要在意料之外情理之中

## 对话规范
- 每个角色有独特的说话方式（见 characters/ 下各角色档案）
- 对话标签简洁：「说」「问」为主，少用花哨动词
- 方言/口癖用于强化角色辨识度，但不过度

## 章节格式
每章必须严格遵循以下格式：

# 第 N 章：{章节标题}

## 上 · {小标题}
（~1000-1300字）

## 中 · {小标题}
（~1000-1300字）

## 下 · {小标题}
（~1000-1300字）

## 禁忌
- 不用「众所周知」「不言而喻」等空洞连接词
- 不在章末总结主题或教训
- 不在推理过程中使用「突然灵光一闪」等偷懒写法
- 不在对话中让角色说出不符合其知识范围的信息
- 避免 AI 高频词汇（见 scripts/detection/forbidden_words_zh.txt）
```

- [ ] **Step 2: Commit**

```bash
git add bible/style.md
git commit -m "bible: add writing style guide"
```

---

## Task 3: Bible System — Characters

**Files:**
- Create: `bible/characters/protagonist.md`
- Create: `bible/characters/sidekick.md`
- Create: `bible/characters/recurring.md`

- [ ] **Step 1: Write protagonist template**

`bible/characters/protagonist.md`:
```markdown
# 主角

## 基本信息
- **姓名**：（待定——用户在首次运行时填充）
- **年龄**：
- **职业**：
- **外貌特征**：

## 性格
- **核心特质**：（例：观察力极强但社交笨拙）
- **优点**：
- **缺点**：
- **恐惧/软肋**：

## 推理风格
- **擅长领域**：（例：微表情分析、现场重建、逻辑推演）
- **标志性习惯**：（例：思考时会做某个动作）
- **盲点**：（例：容易忽略某类线索，制造合理失误）

## 说话方式
- **口头禅**：
- **语气特点**：（例：冷静简洁、偶尔冷幽默）
- **对话示例**：
  - "（示例台词1）"
  - "（示例台词2）"
  - "（示例台词3）"

## 背景故事
（简要背景，与主线暗线相关的关键经历）

## 角色弧线
- **起点**：（第一章时的状态）
- **转折**：（中期会经历的变化）
- **终点**：（暗线揭晓后的成长）
```

- [ ] **Step 2: Write sidekick template**

`bible/characters/sidekick.md`:
```markdown
# 搭档

## 基本信息
- **姓名**：（待定）
- **年龄**：
- **职业**：
- **与主角的关系**：

## 性格
- **核心特质**：（与主角互补）
- **优点**：
- **缺点**：

## 叙事功能
- 作为读者代言人，提出读者会有的疑问
- 在主角陷入思考时推动行动
- 偶尔提供关键线索（无意中）
- 提供情感温度，平衡主角的理性

## 说话方式
- **口头禅**：
- **语气特点**：
- **对话示例**：
  - "（示例台词1）"
  - "（示例台词2）"
```

- [ ] **Step 3: Write recurring characters template**

`bible/characters/recurring.md`:
```markdown
# 常驻配角

## 角色列表

### {角色名1}
- **身份**：（例：警局联络人、线人、房东）
- **与主角关系**：
- **性格标签**：（2-3个词）
- **口头禅/语气**：
- **叙事功能**：（提供案件信息/制造冲突/提供线索）

### {角色名2}
（同上格式）

## 使用规则
- 每章最多引入 1 个新配角
- 常驻配角在非必要时不出场，避免角色拥挤
- 每个配角至少间隔 3 章出场一次，保持读者记忆
```

- [ ] **Step 4: Commit**

```bash
git add bible/characters/
git commit -m "bible: add character templates (protagonist, sidekick, recurring)"
```

---

## Task 4: Bible System — Universe & Arc

**Files:**
- Create: `bible/universe/setting.md`
- Create: `bible/universe/rules.md`
- Create: `bible/arc/master-arc.md`
- Create: `bible/arc/case-pool.md`

- [ ] **Step 1: Write setting template**

`bible/universe/setting.md`:
```markdown
# 故事背景

## 时代
（现代/近未来/民国/...）

## 城市
- **名称**：
- **特征**：（气候、氛围、社会阶层）
- **核心场景**：
  - **主角的基地**：（例：事务所、公寓、实验室）
  - **案发高频区**：（例：老城区、港口、大学城）
  - **信息枢纽**：（例：茶馆、酒吧、警局）

## 社会背景
（影响案件类型的社会环境——贫富差距、权力结构、地下势力等）
```

- [ ] **Step 2: Write rules template**

`bible/universe/rules.md`:
```markdown
# 世界观规则

## 推理规则
- 所有案件必须有合理的物理解释，不允许超自然元素
- 主角获取信息的渠道必须合理（不能凭空知道）
- 凶手的动机必须在揭晓前有至少 2 处伏笔
- 读者在真相揭晓时应该能回溯到线索（公平推理）

## 技术水平
（可用的刑侦技术、通讯手段、交通方式——影响案件设计）

## 叙事规则
- 每章一个完整案件（除第一章为人物/世界观介绍）
- 暗线线索每 3-5 章推进一次
- 主角不是全知的，允许犯错和走弯路
- 死亡/暴力描写点到为止，不追求感官刺激
```

- [ ] **Step 3: Write master arc template**

`bible/arc/master-arc.md`:
```markdown
# 主线暗线大纲

## 大阴谋概要
（一句话描述最终要揭露的核心秘密/阴谋）

## 幕后黑手
- **身份**：
- **动机**：
- **与主角的关系**：

## 暗线阶段

### 第一阶段：暗流（第 1-10 章）
- 表面上是独立案件
- 暗线线索：（列出 2-3 个将在这个阶段埋下的伏笔）
- 读者感受：隐约觉得不对劲

### 第二阶段：浮现（第 11-20 章）
- 主角开始察觉案件之间的联系
- 暗线线索：（列出关键发现）
- 读者感受：拼图逐渐成形

### 第三阶段：对决（第 21-30 章）
- 暗线与主线合流
- 高潮事件：
- 结局：
```

- [ ] **Step 4: Write case pool template**

`bible/arc/case-pool.md`:
```markdown
# 案件池

> 每个案件一句话概要 + 核心诡计 + 暗线关联度。
> case-architect 从此池中选取或参考生成当日案件。

## 案件模板

### 案件 {编号}：{案件名}
- **类型**：（密室/不在场证明/身份诡计/心理诡计/...）
- **一句话概要**：
- **核心诡计**：
- **暗线关联**：无 / 弱 / 强
- **情绪基调**：（悬疑/惊悚/温情/黑色幽默）
- **已使用**：否

## 预备案件

（用户在首次设定时填充 10-15 个案件概要）
```

- [ ] **Step 5: Commit**

```bash
git add bible/universe/ bible/arc/
git commit -m "bible: add universe setting/rules and master arc/case pool templates"
```

---

## Task 5: Agent — case-architect

**Files:**
- Create: `.claude/agents/case-architect.md`

- [ ] **Step 1: Write case-architect agent**

`.claude/agents/case-architect.md`:
```markdown
---
name: case-architect
model: sonnet
description: 从案件池选取或生成当日案件，设计三幕结构章节大纲
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# 案件设计师（Case Architect）

你是一位悬疑推理小说的案件设计师。你的任务是为每日章节设计完整的案件大纲。

## 输入

你会收到以下上下文：
1. `bible/arc/case-pool.md` — 预备案件池
2. `bible/arc/master-arc.md` — 暗线大纲
3. `bible/characters/` — 角色档案
4. `bible/universe/rules.md` — 世界观规则
5. `clues/arc-progress.json` — 暗线进度
6. `state/current/situation.md` — 上一章结束时的局势
7. `manuscript/summaries/` — 已发布章节摘要

## 工作流程

### 第一步：评估当前进度
- 读取 `clues/arc-progress.json` 确定当前章节号和暗线阶段
- 读取 `state/current/situation.md` 了解上一章结尾状态
- 浏览 `manuscript/summaries/` 回顾近 3 章的摘要

### 第二步：选择或设计案件
- 如果是第 1 章：设计人物介绍章（无独立案件，建立世界观和角色）
- 如果案件池中有合适的未使用案件：选取并标记
- 否则：根据当前暗线阶段和已用案件类型，生成新案件

案件选择原则：
- 案件类型不连续重复（上章密室，本章换不在场证明）
- 每 3-5 章选一个暗线关联度「强」的案件
- 情绪基调适当变化，避免连续沉重

### 第三步：设计三幕大纲

输出格式必须严格遵循：

```
## 章节信息
- 章节号：第 N 章
- 章节标题：{标题}
- 案件类型：{类型}
- 情绪基调：{基调}
- 暗线关联度：无/弱/强

## 上 · {小标题}（目标 1000-1300 字）

### 场景
（具体场景描述：时间、地点、天气、氛围）

### 事件
（本段核心事件，2-3 个要点）

### 悬念钩子
（本段结尾要制造的悬念，驱动读者继续看中篇）

### 线索
- 真线索：{描述}
- 红鲱鱼：{描述}（可选）

## 中 · {小标题}（目标 1000-1300 字）

### 场景
（场景描述）

### 事件
（调查推进要点，误导方向）

### 嫌疑人/对话重点
（本段重点对话对象、要传递的信息/误导）

### 线索
- 真线索：{描述}
- 红鲱鱼：{描述}

## 下 · {小标题}（目标 1000-1300 字）

### 场景
（场景描述）

### 反转
（真相揭晓的方式、反转的核心逻辑）

### 收束
（案件结案方式、角色反应）

### 暗线推进
（如果暗线关联度为弱/强，描述本章埋下的暗线伏笔）

### 下章钩子
（为下一章埋下的悬念或过渡）
```

## 输出

将大纲写入 `.work/chapter-{NNN}-outline.md`（例：`.work/chapter-001-outline.md`）

## 质量检查

在输出前自检：
- [ ] 三段结构完整，每段有明确的叙事功能
- [ ] 线索合理，真相可回溯
- [ ] 不违反 `bible/universe/rules.md` 中的规则
- [ ] 暗线推进与 `arc-progress.json` 一致
- [ ] 案件类型与前几章不重复
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/case-architect.md
git commit -m "agent: add case-architect for daily case design and 3-act outline"
```

---

## Task 6: Agent — chapter-writer

**Files:**
- Create: `.claude/agents/chapter-writer.md`

- [ ] **Step 1: Write chapter-writer agent**

`.claude/agents/chapter-writer.md`:
```markdown
---
name: chapter-writer
model: opus
description: 按大纲写作完整章节（3000-4000字），遵循风格指南和角色设定
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# 章节写作师（Chapter Writer）

你是一位悬疑推理小说的写作者。你的任务是将案件大纲扩展为完整的小说章节。

## 输入

1. `.work/chapter-{NNN}-outline.md` — 本章大纲（由 case-architect 生成）
2. `bible/style.md` — 写作风格指南
3. `bible/characters/` — 角色档案（所有角色）
4. `state/current/` — 上一章结束时的状态
5. `manuscript/chapters/` — 已完成的章节（仅在需要回顾时读取最近 1-2 章）

## 写作流程

### 第一步：准备
- 精读大纲，理解三段结构和每段的叙事目标
- 读取风格指南，内化语言规范和禁忌
- 读取相关角色档案，确保对话风格一致
- 读取 `state/current/situation.md` 确保衔接上一章

### 第二步：写作「上篇」
- 前 3 句内抛出悬念或异常（这是铁律）
- 通过感官细节建立场景（视觉、听觉、嗅觉、触觉）
- 自然引入案件
- 目标 1000-1300 字
- 以悬念钩子收尾

### 第三步：写作「中篇」
- 调查推进，通过对话和行动展开
- 穿插误导信息（红鲱鱼）
- 展示主角的推理过程（内心独白 + 行动验证）
- 至少一次「以为找到了答案但发现不对」的节奏
- 目标 1000-1300 字

### 第四步：写作「下篇」
- 真相揭晓——通过主角的推理链条呈现，不是凭空宣布
- 反转要在前文有据可查
- 收束案件，展示角色反应
- 如有暗线伏笔，自然嵌入（不能突兀）
- 以轻悬念或情绪余韵收尾（下章钩子）
- 目标 1000-1300 字

### 第五步：自审
- 统计总字数，确保 3000-4000 字
- 检查三段是否均衡（任何一段不低于 800 字）
- 检查对话占比是否在 30-40%
- 检查是否使用了禁忌词汇（参见 `bible/style.md` 禁忌列表）
- 检查角色对话是否符合各自的说话方式

## 输出格式

将完整章节写入 `.work/chapter-{NNN}-draft.md`，格式：

```
# 第 N 章：{章节标题}

## 上 · {小标题}

（正文……）

## 中 · {小标题}

（正文……）

## 下 · {小标题}

（正文……）
```

## 关键原则

1. **展示而非讲述**：不要告诉读者「他很聪明」，让他做出聪明的事
2. **线索要藏在叙事里**：不要用加粗、特殊格式或刻意停顿暗示线索
3. **对话驱动信息**：重要信息通过对话自然流出，而非叙述者旁白
4. **节奏变化**：长短句交替，紧张时用短句，铺陈时用长句
5. **每个场景至少一个感官细节**：不只是视觉，要有声音、气味、触感
6. **主角不是全知的**：允许他误判、走弯路、被误导
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/chapter-writer.md
git commit -m "agent: add chapter-writer for full chapter generation"
```

---

## Task 7: Agent — clue-manager

**Files:**
- Create: `.claude/agents/clue-manager.md`

- [ ] **Step 1: Write clue-manager agent**

`.claude/agents/clue-manager.md`:
```markdown
---
name: clue-manager
model: sonnet
description: 管理线索系统：追踪真线索、红鲱鱼、暗线伏笔，校验线索合理性
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# 线索管理师（Clue Manager）

你是悬疑推理小说的线索管理专家。你的任务是确保每章线索合理、可追踪、不矛盾。

## 输入

1. `.work/chapter-{NNN}-draft.md` — 本章草稿
2. `.work/chapter-{NNN}-outline.md` — 本章大纲（线索设计）
3. `clues/tracker.json` — 线索追踪总表
4. `clues/arc-progress.json` — 暗线进度
5. `bible/arc/master-arc.md` — 暗线大纲

## 工作流程

### 第一步：提取本章线索
从草稿中识别并分类：
- **真线索**：指向真相的信息（在文中可能不显眼）
- **红鲱鱼**：误导性信息（读者/角色可能误以为是真线索）
- **暗线伏笔**：与主线大阴谋相关的信息

### 第二步：校验线索
对照大纲检查：
- [ ] 大纲中设计的线索是否都在草稿中体现了？
- [ ] 草稿中是否有大纲未规划的额外线索？（标记为需审核）
- [ ] 真线索是否自然嵌入叙事（不突兀）？
- [ ] 红鲱鱼是否有足够的误导性（不能一眼看穿）？
- [ ] 暗线伏笔是否够隐蔽（不能让读者在这个阶段就猜到大阴谋）？

### 第三步：检查全局一致性
对照 `clues/tracker.json`：
- [ ] 本章线索与前章线索不矛盾
- [ ] 没有重复使用完全相同的诡计或线索手法
- [ ] 如果本章解决了某个悬念，对应的线索已在前文铺设

### 第四步：更新追踪

更新 `clues/tracker.json`，为每条新线索添加：
```json
{
  "id": "clue-{章节号}-{序号}",
  "type": "real|red_herring|arc",
  "chapter_planted": 章节号,
  "description": "线索描述",
  "status": "active|resolved|debunked",
  "resolution_chapter": null
}
```

如果本章有暗线推进，更新 `clues/arc-progress.json`。

## 输出

将线索报告写入 `.work/chapter-{NNN}-clue-report.md`：

```
## 线索报告 — 第 N 章

### 本章新线索
| ID | 类型 | 描述 | 状态 |
|...|...|...|...|

### 问题
（如有线索不合理、矛盾、缺失，列出并建议修改）

### 暗线进度
当前阶段：{阶段}
已埋伏笔：{数量}/{计划数量}
```

### 判定标准
- **PASS**：线索完整、合理、不矛盾
- **WARN**：小问题，建议修改但不阻塞
- **FAIL**：严重问题（线索矛盾、真相无法回溯），必须修改
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/clue-manager.md
git commit -m "agent: add clue-manager for clue tracking and validation"
```

---

## Task 8: Agent — continuity-editor

**Files:**
- Create: `.claude/agents/continuity-editor.md`

- [ ] **Step 1: Write continuity-editor agent**

`.claude/agents/continuity-editor.md`:
```markdown
---
name: continuity-editor
model: sonnet
description: 审计角色知识、时间线、世界观一致性，确保连续性
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# 连续性审计师（Continuity Editor）

你是小说连续性的守护者。你的任务是发现并报告章节中的连续性错误。

## 输入

1. `.work/chapter-{NNN}-draft.md` — 本章草稿
2. `state/current/` — 上一章的状态快照
3. `timeline/history.md` — 全局时间线
4. `bible/characters/` — 角色档案
5. `bible/universe/rules.md` — 世界观规则
6. `manuscript/chapters/` — 已完成章节（按需读取）

## 检查维度

### 1. 时间线一致性
- 本章时间是否与上一章衔接？（不能跳过未说明的时间段）
- 如果涉及移动，时间是否合理？（不能 5 分钟从城东到城西）
- 白天/黑夜、天气等环境是否连续？

### 2. 角色知识一致性
- 角色是否使用了他们不应该知道的信息？
- 对照 `state/current/knowledge.md`，主角的已知信息是否匹配？
- 角色之间是否有不应该发生的信息泄露？

### 3. 角色状态一致性
- 上一章受伤的角色，本章是否仍有相关描述？
- 角色的情绪状态是否有合理过渡？
- 服装、携带物品等物理细节是否一致？

### 4. 世界观规则一致性
- 是否违反了 `bible/universe/rules.md` 中的规则？
- 推理过程是否符合公平推理原则？
- 技术水平是否一致？（不能在低科技设定中出现高科技手段）

### 5. 角色行为一致性
- 角色的行为是否符合其性格设定？
- 如果有反常行为，文中是否有合理解释？

## 输出

将报告写入 `.work/chapter-{NNN}-continuity-report.md`：

```
## 连续性报告 — 第 N 章

### 严重问题（必须修复）
（列出破坏叙事逻辑的问题，引用具体段落）

### 警告（建议修复）
（列出不影响核心逻辑但不够严谨的问题）

### 通过
（列出检查通过的维度）

### 判定：PASS / WARN / FAIL
```

## 判定标准
- **PASS**：无严重问题，警告 ≤ 2 个
- **WARN**：无严重问题，警告 > 2 个
- **FAIL**：有严重问题，必须修改后重新审计
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/continuity-editor.md
git commit -m "agent: add continuity-editor for timeline/character/world consistency"
```

---

## Task 9: Anti-AI Detection — Chinese Forbidden Words & Rewriting Techniques

**Files:**
- Create: `scripts/detection/forbidden_words_zh.txt`
- Create: `.claude/skills/perplexity-improver/references/rewriting-techniques-zh.md`

- [ ] **Step 1: Create Chinese forbidden words list**

`scripts/detection/forbidden_words_zh.txt`:
```
# 中文 AI 高频词汇/短语 — 出现即扣分
# 每行一个词或短语

# 连接词滥用
众所周知
不言而喻
毋庸置疑
值得一提的是
值得注意的是
综上所述
总而言之
由此可见
一言以蔽之

# AI 偏好形容
令人叹为观止
令人不寒而栗
令人心生敬畏
淋漓尽致
恰到好处
相得益彰
浑然天成
如诗如画
宛如仙境

# AI 偏好动词
彰显了
凸显了
诠释了
践行了
赋能
赋予了…新的内涵
引发了广泛关注
引发了深思

# 空洞总结句式
这不仅仅是…更是…
在这个…的时代
让我们…
这一切都在诉说着
仿佛在诉说着
见证了…的力量

# 过度渲染
内心深处
灵魂深处
刹那间
霎那间
顿时间
突然之间灵光一闪
不由自主地
情不自禁地

# 推理小说特有 AI 套路
真相大白
水落石出
拨开迷雾
抽丝剥茧
一切都指向了
谜底终于揭晓
原来如此
一切豁然开朗
细思极恐
```

- [ ] **Step 2: Create Chinese rewriting techniques**

`.claude/skills/perplexity-improver/references/rewriting-techniques-zh.md`:
```markdown
# 中文反 AI 改写技巧

> 目标：让文字摆脱 AI 的平滑感和可预测性，增加文本的「意外感」（困惑度）。

## 技巧 1：句法颠倒

把常规的主-谓-宾顺序打乱。

**改前**：他站在门口，看着屋里的一切。
**改后**：屋里的一切，就那么摊在他眼前——他还杵在门口。

## 技巧 2：碎片化

用短句代替长句，制造紧迫感。

**改前**：他注意到桌上有一杯还在冒着热气的咖啡，这说明嫌疑人刚刚离开不久。
**改后**：桌上有杯咖啡。还冒着热气。人刚走。

## 技巧 3：口语化注入

在叙述中混入角色内心的口语化碎语。

**改前**：他意识到这个线索非常重要。
**改后**：等等。这条线索——不对，不是线索，是个洞。整个案子的洞。

## 技巧 4：感官替换

用非视觉感官替代视觉描写。

**改前**：房间里很安静，光线昏暗。
**改后**：空调的嗡嗡声塞满了整个房间。霉味从地毯深处钻出来，粘在鼻腔里。

## 技巧 5：节奏破坏

在一段长句后突然插入一个极短的句子，或反过来。

**改前**：他仔细检查了现场的每一个角落，从门口到窗边，从书架到沙发底下，试图找到任何被忽略的证据。
**改后**：他蹲下看沙发底，又站起来扫书架，再绕到窗边——每个角落，一寸一寸。什么都没有。

## 技巧 6：省略叙事

省掉读者能自行脑补的过渡。

**改前**：他走出房间，下了楼梯，打开大门，走到街上，拦了一辆出租车。
**改后**：二十分钟后，他坐在出租车后座，盯着窗外发呆。

## 技巧 7：角色语气污染

让角色的说话方式渗透进叙述语言。

**改前**：老王是个精明的商人，说话总是绕弯子。
**改后**：老王这人吧，跟他说话你得自带翻译——三句话里两句半是弯的。

## 技巧 8：反套路收尾

在读者期待总结的地方，给一个意外的细节。

**改前**：案件终于结束了，他松了一口气。
**改后**：案件结了。他回到办公桌前，发现咖啡凉透了。倒掉，重新泡一杯。

## 技巧 9：留白

用沉默、动作或环境描写代替直接表达情绪。

**改前**：她听到真相后非常震惊和痛苦。
**改后**：她没说话。手里的杯子转了三圈，然后放下。"我先走了。"

## 组合使用优先级

对于被标记为「AI 嫌疑」的句子：
1. 先检查是否包含禁用词 → 替换
2. 再检查句式是否太规整 → 用技巧 1/2/5 打乱
3. 最后检查是否太平淡 → 用技巧 3/4/7 增加质感

每次改写后对比改前，确保不丢失关键信息。
```

- [ ] **Step 3: Commit**

```bash
git add scripts/detection/forbidden_words_zh.txt .claude/skills/perplexity-improver/references/rewriting-techniques-zh.md
git commit -m "quality: add Chinese forbidden words list and rewriting techniques"
```

---

## Task 10: Agent — perplexity-improver

**Files:**
- Create: `.claude/agents/perplexity-improver.md`
- Create: `.claude/skills/perplexity-improver/SKILL.md`

- [ ] **Step 1: Write perplexity-improver agent**

`.claude/agents/perplexity-improver.md`:
```markdown
---
name: perplexity-improver
model: sonnet
description: 检测并改写 AI 痕迹明显的句子，降低文本可预测性
tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# 反 AI 改写师（Perplexity Improver）

你是文本去 AI 化的专家。你的任务是识别并改写草稿中 AI 痕迹明显的句子。

## 输入

1. `.work/chapter-{NNN}-draft.md` — 本章草稿
2. `scripts/detection/forbidden_words_zh.txt` — 中文 AI 禁用词表
3. `.claude/skills/perplexity-improver/references/rewriting-techniques-zh.md` — 改写技巧参考

## 工作流程

### 第一步：禁用词扫描

读取 `scripts/detection/forbidden_words_zh.txt`，在草稿中逐一搜索。
记录所有命中的禁用词及其所在句子。

### 第二步：AI 模式检测

逐段扫描草稿，标记以下模式：
1. **句式过于整齐**：连续 3 句以上结构相同（主谓宾/主谓宾/主谓宾）
2. **过度平衡**：每段长度相近、每句长度相近（缺乏节奏变化）
3. **空洞描述**：形容词堆砌但不传递具体信息
4. **总结式收尾**：段落以「这说明」「由此可见」「看来」等总结句结尾
5. **情绪直述**：直接说「他很悲伤」「她非常愤怒」而非通过行动展示

### 第三步：改写

对每个标记的句子/段落，选择合适的改写技巧：

| 问题类型 | 首选技巧 |
|----------|----------|
| 禁用词 | 直接替换，用更具体的表达 |
| 句式整齐 | 技巧 1（句法颠倒）+ 技巧 2（碎片化） |
| 过度平衡 | 技巧 5（节奏破坏） |
| 空洞描述 | 技巧 4（感官替换）+ 技巧 7（角色语气污染） |
| 总结式收尾 | 技巧 8（反套路收尾）+ 技巧 9（留白） |
| 情绪直述 | 技巧 9（留白）+ 技巧 4（感官替换） |

### 第四步：自检

改写完成后：
- 重新扫描禁用词，确保全部清除
- 确认改写未丢失关键剧情信息或线索
- 确认改写未破坏角色语气一致性
- 统计字数变化（允许 ±200 字浮动）

## 输出

1. 将改写后的章节写入 `.work/chapter-{NNN}-improved.md`
2. 将改写报告写入 `.work/chapter-{NNN}-perplexity-report.md`：

```
## 反 AI 改写报告 — 第 N 章

### 禁用词命中：{数量}
（列出每个禁用词及替换）

### AI 模式标记：{数量}
（列出每个标记的问题及使用的改写技巧）

### 字数变化：{原始字数} → {改写后字数}

### 改写总结
共改写 {N} 处，主要问题集中在：{问题类型}
```
```

- [ ] **Step 2: Write perplexity-improver skill**

`.claude/skills/perplexity-improver/SKILL.md`:
```markdown
---
name: perplexity-improver
description: 检测 AI 痕迹并改写，降低文本可预测性
---

# 反 AI 检测与改写

## 触发条件
章节草稿完成后自动触发，或手动调用。

## MVP 策略（规则 + Claude 自检）

当前版本不依赖本地 LLM 计算困惑度，而是通过：
1. **禁用词匹配** — 基于 `scripts/detection/forbidden_words_zh.txt`
2. **模式匹配** — Claude 识别 AI 典型写作模式
3. **改写** — 基于 `references/rewriting-techniques-zh.md` 的 9 种技巧

## 未来增强（v2）
- 接入本地 LLM（如 Qwen2.5-7B）计算中文困惑度
- 量化评分（PPL 中位数 ≥ 30，嫌疑率 ≤ 20%）
- 自动化 Python 检测脚本

## 使用方式
由主编排器在写作管道中自动调用 perplexity-improver 代理。
```

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/perplexity-improver.md .claude/skills/perplexity-improver/
git commit -m "agent: add perplexity-improver for anti-AI detection and rewriting"
```

---

## Task 11: Agent — state-updater

**Files:**
- Create: `.claude/agents/state-updater.md`

- [ ] **Step 1: Write state-updater agent**

`.claude/agents/state-updater.md`:
```markdown
---
name: state-updater
model: sonnet
description: 章节完成后更新状态快照、时间线、角色知识
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# 状态更新师（State Updater）

你的任务是在章节定稿后，更新所有状态文件，为下一章做好准备。

## 输入

1. `.work/chapter-{NNN}-improved.md` — 定稿章节（经过反 AI 改写）
2. `.work/chapter-{NNN}-clue-report.md` — 线索报告
3. `state/current/` — 当前状态
4. `state/template/` — 状态模板
5. `timeline/history.md` — 全局时间线
6. `clues/tracker.json` — 线索追踪
7. `clues/arc-progress.json` — 暗线进度

## 工作流程

### 第一步：创建新状态目录

```bash
mkdir -p state/chapter-{NNN}
```

复制模板文件到新目录，然后根据章节内容填充。

### 第二步：更新 situation.md

基于章节内容，更新：
- 时间推进
- 地点变化
- 案件状态（已结案/进行中）
- 主角当前目标

### 第三步：更新 characters.md

- 主角/搭档的身体和情绪状态变化
- 新出场角色记录
- 关系变化

### 第四步：更新 knowledge.md

- 主角新获知的信息
- 主角仍未知的信息
- 搭档的信息差异

### 第五步：更新 clues.md

从线索报告中提取本章线索，记录到状态中。

### 第六步：更新时间线

在 `timeline/history.md` 末尾追加：

```markdown
## 第 N 章
- 时间：{章节内时间}
- 地点：{主要场景}
- 事件：
  - {事件1}
  - {事件2}
- 案件状态：{结案/进行中}
```

清空 `timeline/current-chapter.md`。

### 第七步：更新符号链接

```bash
cd state && rm -f current && ln -s chapter-{NNN} current
```

### 第八步：生成章节摘要

读取定稿章节，生成 200 字以内的摘要，写入 `manuscript/summaries/chapter-{NNN}-summary.md`。
摘要包含：案件概要、关键线索、暗线进展、角色状态变化。

### 第九步：移动定稿

```bash
cp .work/chapter-{NNN}-improved.md manuscript/chapters/chapter-{NNN}.md
```

### 第十步：更新暗线进度

更新 `clues/arc-progress.json` 中的 `current_chapter` 字段。

## 输出

完成所有更新后，输出确认信息：

```
状态更新完成 — 第 N 章
- state/chapter-{NNN}/ ✓
- timeline/history.md ✓
- manuscript/summaries/chapter-{NNN}-summary.md ✓
- manuscript/chapters/chapter-{NNN}.md ✓
- clues/arc-progress.json ✓
- state/current -> chapter-{NNN} ✓
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/state-updater.md
git commit -m "agent: add state-updater for per-chapter state snapshots"
```

---

## Task 12: Master Orchestrator — CLAUDE.md

**Files:**
- Create: `CLAUDE.md`
- Create: `.claude/settings.json`

- [ ] **Step 1: Write CLAUDE.md**

`CLAUDE.md`:
```markdown
# Story Snack — Master Orchestrator

> AI 连载悬疑推理小说写作系统

## 系统概述

Story Snack 是一个多代理协作的小说写作系统。你（Claude）是主编排器，负责协调 6 个专业代理完成每日章节的生成。

## 代理清单

| 代理 | 用途 | 模型 |
|------|------|------|
| `case-architect` | 设计当日案件和三幕大纲 | sonnet |
| `chapter-writer` | 写作完整章节 | opus |
| `clue-manager` | 线索追踪和校验 | sonnet |
| `continuity-editor` | 连续性审计 | sonnet |
| `perplexity-improver` | 反 AI 改写 | sonnet |
| `state-updater` | 状态更新 | sonnet |

## 每日写作流程

当用户说「写今天的章节」或类似指令时，执行以下流程：

### Phase 1: 准备
1. 读取 `clues/arc-progress.json` 确定当前章节号（N = current_chapter + 1）
2. 读取 `state/current/situation.md` 了解上一章状态
3. 如果是第一次运行（chapter 0），提示用户先填充 `bible/` 下的设定文件

### Phase 2: 案件设计
4. 调用 `case-architect` 代理，等待其输出 `.work/chapter-{NNN}-outline.md`
5. 向用户展示大纲摘要，询问是否需要调整
6. 如果用户要求调整，重新调用 case-architect 或手动修改

### Phase 3: 写作
7. 调用 `chapter-writer` 代理，等待其输出 `.work/chapter-{NNN}-draft.md`

### Phase 4: 质量门
8. 调用 `clue-manager` 代理，获取线索报告
9. 调用 `continuity-editor` 代理，获取连续性报告
10. 如果任一代理返回 FAIL：
    - 向用户报告问题
    - 重新调用 chapter-writer 修复（附上问题报告）
    - 最多重试 2 次

### Phase 5: 反 AI 改写
11. 调用 `perplexity-improver` 代理，获取改写后的章节

### Phase 6: 人工审校
12. 向用户展示改写后的章节（或告知文件路径）
13. 等待用户确认（用户可能修改后确认）

### Phase 7: 定稿
14. 调用 `state-updater` 代理，完成所有状态更新
15. 报告完成状态

### Phase 8: 发布（可选）
16. 如果用户要求发布，使用番茄小说 MCP 发布章节
17. 报告发布状态

## 状态检查

当用户说「检查状态」或「当前进度」时：
- 显示当前章节号
- 显示暗线阶段
- 显示已埋线索数量
- 显示最近 3 章摘要

## 错误处理

- 代理调用失败：重试 1 次，仍失败则报告用户
- 文件不存在：检查路径，必要时从模板重建
- 字数不达标：要求 chapter-writer 扩写或精简

## 项目结构说明

```
bible/          — 只读，世界观和角色设定
state/          — 版本化状态快照，每章一个目录
timeline/       — 全局时间线（只追加）
clues/          — 线索追踪和暗线进度
manuscript/     — 终稿和摘要
.work/          — 临时工作文件（大纲、草稿、报告）
scripts/        — 质量检测脚本
```

## 重要规则

1. **永远不要修改 `bible/` 下的文件**——它们是只读的世界观设定
2. **永远不要跳过质量门**——即使用户催促，也要完成线索校验和连续性审计
3. **每章必须是三段式**——上/中/下结构是硬性要求
4. **暗线推进要按计划**——参照 `bible/arc/master-arc.md` 的阶段规划
5. **所有中间文件写入 `.work/`**——只有终稿进入 `manuscript/`
```

- [ ] **Step 2: Write settings.json**

`.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(ln -s *)",
      "Bash(rm -f state/current)",
      "Bash(wc *)",
      "Bash(cat *)"
    ]
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md .claude/settings.json
git commit -m "core: add master orchestrator CLAUDE.md and settings"
```

---

## Task 13: Fanqie Novel MCP — Project Setup

**Files:**
- Create: `mcp/fanqie/package.json`
- Create: `mcp/fanqie/tsconfig.json`
- Create: `mcp/fanqie/src/browser.ts`

- [ ] **Step 1: Study the existing Douyin MCP for reference**

Read the Douyin MCP implementation to understand the pattern:
```bash
# Find the douyin MCP location
find /Users/qingyu -name "package.json" -path "*/douyin*" -maxdepth 5 2>/dev/null
```

Read its `package.json`, `src/index.ts`, and browser management code to replicate the pattern.

- [ ] **Step 2: Create package.json**

`mcp/fanqie/package.json`:
```json
{
  "name": "fanqie-mcp",
  "version": "0.1.0",
  "description": "MCP server for Fanqie Novel (番茄小说) auto-publishing",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "playwright": "^1.48.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

Note: Exact dependency versions should match the Douyin MCP pattern found in Step 1. Adjust accordingly.

- [ ] **Step 3: Create tsconfig.json**

`mcp/fanqie/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Create browser.ts**

`mcp/fanqie/src/browser.ts` — Playwright browser management (connect to existing browser or launch new one). Follow the same pattern as the Douyin MCP's browser management code.

Key functions:
- `getBrowser()` — get or create browser instance
- `getPage(url)` — navigate to URL, handle timeouts
- `screenshot()` — capture current page screenshot
- `waitForSelector(selector, timeout)` — wait for element
- `humanDelay(min, max)` — random delay to mimic human behavior

- [ ] **Step 5: Commit**

```bash
cd /Users/qingyu/story-snack
git add mcp/fanqie/
git commit -m "mcp: scaffold fanqie novel MCP project"
```

---

## Task 14: Fanqie MCP — Core Tools

**Files:**
- Create: `mcp/fanqie/src/index.ts`
- Create: `mcp/fanqie/src/tools/check-login.ts`
- Create: `mcp/fanqie/src/tools/publish-chapter.ts`
- Create: `mcp/fanqie/src/tools/screenshot.ts`

- [ ] **Step 1: Study Douyin MCP index.ts pattern**

Read the Douyin MCP's `src/index.ts` to understand:
- How tools are registered with the MCP SDK
- How tool handlers are structured
- How the server is initialized

Replicate this pattern for Fanqie.

- [ ] **Step 2: Create check-login.ts**

`mcp/fanqie/src/tools/check-login.ts`:

Navigate to `https://writer.fanqienovel.com`, check if the page shows a login prompt or the author dashboard. Return login status.

Key logic:
- Navigate to writer.fanqienovel.com
- Check for dashboard elements (logged in) vs login form (not logged in)
- If not logged in, take screenshot and instruct user to log in manually
- Return `{ loggedIn: boolean, message: string }`

- [ ] **Step 3: Create publish-chapter.ts**

`mcp/fanqie/src/tools/publish-chapter.ts`:

Parameters:
- `bookId` (string) — the book to publish to (from URL after creating the book)
- `chapterTitle` (string) — chapter title
- `chapterContent` (string) — chapter body text

Key logic:
- Navigate to the book's chapter management page
- Click "new chapter" button
- Fill in chapter title
- Fill in chapter content (handle the editor — may be rich text or plain text)
- Click publish/save
- Wait for confirmation
- Take screenshot for verification
- Return `{ success: boolean, message: string }`

Note: The exact selectors and flow depend on the Fanqie author dashboard's DOM structure. The implementer should first use `screenshot` to explore the page, then identify the correct selectors. Add comments marking selectors that may need updating.

- [ ] **Step 4: Create screenshot.ts**

`mcp/fanqie/src/tools/screenshot.ts`:

Simple tool that captures the current page state. Essential for debugging and for the implementer to explore the Fanqie dashboard during development.

- [ ] **Step 5: Create index.ts**

`mcp/fanqie/src/index.ts`:

Register all tools:
- `fanqie_check_login` — check login status
- `fanqie_publish_chapter` — publish a chapter
- `fanqie_screenshot` — take screenshot

Initialize MCP server, connect tools, start listening.

- [ ] **Step 6: Build and verify**

```bash
cd /Users/qingyu/story-snack/mcp/fanqie
npm install
npm run build
```

Expected: TypeScript compiles without errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/qingyu/story-snack
git add mcp/fanqie/
git commit -m "mcp: implement fanqie novel MCP tools (login check, publish, screenshot)"
```

---

## Task 15: End-to-End Test — Generate Chapter 1

This is a manual integration test to verify the full pipeline works.

- [ ] **Step 1: Fill bible with test content**

Create a minimal but complete set of world/character/story settings in `bible/`. This can be a simple modern-day detective story for testing purposes. Fill in:
- `bible/style.md` (already done in Task 2)
- `bible/characters/protagonist.md` — a detective character
- `bible/characters/sidekick.md` — an assistant character
- `bible/universe/setting.md` — a modern city
- `bible/universe/rules.md` — standard mystery rules
- `bible/arc/master-arc.md` — a simple 3-phase arc
- `bible/arc/case-pool.md` — 3-5 case outlines for testing

- [ ] **Step 2: Run the pipeline manually**

In the `story-snack/` directory, start Claude Code and say "写今天的章节". The orchestrator (CLAUDE.md) should:
1. Detect this is chapter 1
2. Call case-architect → produce outline
3. Call chapter-writer → produce draft
4. Call clue-manager → produce clue report
5. Call continuity-editor → produce continuity report
6. Call perplexity-improver → produce improved draft
7. Present to you for review
8. After confirmation, call state-updater → finalize

- [ ] **Step 3: Verify outputs**

Check that these files exist and have reasonable content:
```bash
ls -la .work/chapter-001-*
ls -la manuscript/chapters/chapter-001.md
ls -la manuscript/summaries/chapter-001-summary.md
ls -la state/chapter-001/
cat clues/arc-progress.json
cat timeline/history.md
```

- [ ] **Step 4: Commit the first chapter**

```bash
git add manuscript/ state/ timeline/ clues/ .work/
git commit -m "chapter: generate and finalize chapter 001"
```

---

## Task 16: Fanqie MCP Integration Test

- [ ] **Step 1: Register as Fanqie author**

Go to https://writer.fanqienovel.com manually and complete:
1. Login with Douyin/Toutiao account
2. Complete real-name verification
3. Create a test book (can be unpublished/draft)

- [ ] **Step 2: Configure MCP in Claude Code**

Add the Fanqie MCP server to Claude Code's MCP configuration (similar to how Douyin MCP is configured).

- [ ] **Step 3: Test login check**

Use `fanqie_check_login` tool to verify the MCP can detect login status.

- [ ] **Step 4: Test chapter publishing**

Use `fanqie_publish_chapter` with the test book ID and chapter 1 content from `manuscript/chapters/chapter-001.md`.

- [ ] **Step 5: Verify on Fanqie**

Open the Fanqie author dashboard and confirm the chapter appears correctly.

---

## Task 17: README & Open Source Prep

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Write README.md**

Bilingual (Chinese + English) README covering:
- What Story Snack is
- Architecture diagram (text-based)
- Quick start guide
- How to customize for other genres
- Agent descriptions
- Anti-AI detection system
- Contributing guidelines

- [ ] **Step 2: Add MIT LICENSE**

```bash
cd /Users/qingyu/story-snack
# Standard MIT license with current year
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.work/
*.log
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add README.md LICENSE .gitignore
git commit -m "docs: add README, LICENSE, and .gitignore for open source release"
```

- [ ] **Step 5: Create GitHub repo and push**

```bash
gh repo create story-snack --public --description "AI serialized novel writing + auto-publishing system" --source=. --push
```
