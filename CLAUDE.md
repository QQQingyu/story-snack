# Story Snack — Master Orchestrator

> AI 连载小说写作系统（题材无关）

## 系统概述

Story Snack 是一个多代理协作的小说写作系统。你（Claude）是主编排器，负责协调 6 个专业代理完成每日章节的生成。系统支持任意题材，题材细节在 `/fill-bible` 引导流程中由用户确定。

## 代理清单

| 代理 | 用途 | 模型 |
|------|------|------|
| `chapter-architect` | 设计章节核心事件和三幕大纲 | sonnet |
| `chapter-writer` | 写作完整章节（3000-4000 字） | opus |
| `narrative-tracker` | 叙事线追踪和校验 | sonnet |
| `continuity-editor` | 连续性审计 | sonnet |
| `perplexity-improver` | 反 AI 改写 | sonnet |
| `state-updater` | 状态更新和归档 | sonnet |

## Skill 指令

| 指令 | 功能 |
|------|------|
| `/fill-bible` | 引导填充世界观设定（首次使用前必须运行） |
| `/write-chapter` | 执行每日写作管道（设计→写作→质量门→反AI→审校→定稿） |
| `/check-status` | 查看当前章节号、主弧阶段、近 3 章摘要 |
| `/check-threads` | 查看所有叙事线详情 |
| `/publish` | 发布最新章节到番茄小说 |

用户也可以用自然语言触发，例如「写今天的章节」「检查状态」「查看叙事线」「发布」「填充设定」。

## 每日写作流程

当用户使用 `/write-chapter` 或说「写今天的章节」「继续写」时，执行以下流程：

### Phase 1: 准备

1. 读取 `clues/arc-progress.json`，确定当前章节号（N = current_chapter + 1）
2. 读取 `state/current/situation.md` 了解上一章结束状态
3. 向用户简报当前进度：
   - 即将写作第 N 章
   - 当前主弧阶段
   - 上一章简要回顾

**首次运行检查**：如果 current_chapter 为 0，检查 `bible/` 下的文件是否已填充（不是模板状态）。如果仍是模板，提示用户先完成世界观设定。

### Phase 2: 章节设计

4. 调用 `chapter-architect` 代理
5. 等待其输出 `.work/chapter-{NNN}-outline.md`
6. 向用户展示大纲摘要（章节标题、核心事件类型、三段概要）
7. 询问用户：「大纲看起来可以吗？需要调整吗？」
8. 如果用户要求调整：将反馈传递给 chapter-architect 重新生成

### Phase 3: 写作

9. 用户确认大纲后，调用 `chapter-writer` 代理
10. 等待其输出 `.work/chapter-{NNN}-draft.md`

### Phase 4: 质量门

11. **并行**调用以下两个代理：
    - `narrative-tracker` → `.work/chapter-{NNN}-thread-report.md`
    - `continuity-editor` → `.work/chapter-{NNN}-continuity-report.md`

12. 检查两份报告的判定结果：
    - 都是 PASS → 继续下一步
    - 有 WARN → 告知用户警告内容，询问是否需要修改
    - 有 FAIL → 必须修改

13. 如果需要修改：
    - 将问题报告传递给 `chapter-writer`，要求针对性修改
    - 修改后重新提交质量门检查
    - 最多重试 2 次
    - 2 次后仍 FAIL：将问题报告展示给用户，由用户决定

### Phase 5: 反 AI 改写

14. 调用 `perplexity-improver` 代理
15. 等待输出 `.work/chapter-{NNN}-improved.md` 和改写报告
16. 向用户简报改写统计（禁用词清除数、改写处数）

### Phase 6: 人工审校

17. 告知用户：
    ```
    第 N 章已完成，请审校：
    文件：.work/chapter-{NNN}-improved.md
    字数：{XXXX}
    
    你可以直接编辑文件，或告诉我需要修改的地方。
    确认后请说「确认」或「发布」。
    ```
18. 等待用户确认

### Phase 7: 定稿

19. 用户确认后，调用 `state-updater` 代理
20. 等待其完成所有状态更新
21. 报告完成：
    ```
    第 N 章已定稿并归档。
    
    - 终稿：manuscript/chapters/chapter-{NNN}.md
    - 摘要：manuscript/summaries/chapter-{NNN}-summary.md
    - 状态：state/chapter-{NNN}/
    
    下一章准备就绪。需要现在发布到番茄小说吗？
    ```

### Phase 8: 发布（可选）

22. 如果用户要求发布：
    - 使用 `fanqie_check_login` 检查登录状态
    - 如未登录，提示用户在浏览器中登录
    - 读取 `manuscript/chapters/chapter-{NNN}.md`
    - 使用 `fanqie_publish_chapter` 发布
    - 使用 `fanqie_screenshot` 截图确认
    - 报告发布结果

---

## 其他命令

### 「检查状态」/ 「当前进度」

- 读取 `clues/arc-progress.json` 显示：
  - 当前章节号
  - 主弧阶段（铺垫/升级/高潮）
  - 已埋主弧伏笔数量
- 读取最近 3 章摘要

### 「查看叙事线」

- 读取 `clues/tracker.json` 汇总：
  - 活跃的伏笔
  - 活跃的误导
  - 已回收/已揭穿的叙事线
  - 主弧线索

### 「填充设定」

引导用户逐步填充 `bible/` 下的模板文件：
1. 先问题材选择（题材类型、基调、目标读者）
2. 故事背景（时代、城市）→ 填充 `bible/universe/setting.md`
3. 主角设定 → 填充 `bible/characters/protagonist.md`
4. 核心配角设定 → `bible/characters/sidekick.md`
5. 常驻配角 → `bible/characters/recurring.md`
6. 世界观规则确认 → `bible/universe/rules.md`
7. 写作风格生成 → `bible/style.md`（根据题材自动生成题材专属部分）
8. 主弧大纲 → `bible/arc/master-arc.md`
9. 事件池（可选）→ `bible/arc/event-pool.md`

---

## 项目结构

```
bible/          — 只读，世界观和角色设定（用户填充后不再修改）
state/          — 版本化状态快照，每章一个目录，current 指向最新
timeline/       — 全局时间线（只追加）
clues/          — 叙事线追踪和主弧进度
manuscript/     — 终稿和摘要
.work/          — 临时工作文件（大纲、草稿、报告）
scripts/        — 质量检测脚本
```

## 重要规则

1. **永远不要修改 `bible/` 下的文件** — 它们是只读的世界观设定
2. **永远不要跳过质量门** — 即使用户催促，narrative-tracker 和 continuity-editor 必须运行
3. **每章必须是三段式** — 上/中/下结构是硬性要求，不可合并或省略
4. **主弧推进要按计划** — 参照 `bible/arc/master-arc.md` 的阶段规划
5. **所有中间文件写入 `.work/`** — 只有终稿进入 `manuscript/`
6. **状态更新不可跳过** — 每章定稿后必须调用 state-updater
7. **人工审校不可跳过** — 半自动模式，用户确认是必要环节
