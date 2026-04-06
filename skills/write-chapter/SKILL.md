---
name: write-chapter
description: 执行每日写作管道：章节设计→写作→质量门→反AI改写→人工审校→定稿。生成一个完整章节。
---

# 写今天的章节

执行完整的每日写作管道，生成一个新章节。

## 前置检查

1. 读取 `clues/arc-progress.json`，确定章节号 N = current_chapter + 1
2. 如果 N = 1，检查 `bible/` 是否已填充（不是模板状态）
   - 未填充 → 提示用户先运行 `/fill-bible`
3. 读取 `state/current/situation.md` 了解上一章状态
4. 向用户简报：即将写第 N 章、当前主弧阶段

## 写作管道

### Phase 1: 章节设计
- 调用 `chapter-architect` 代理
- 展示大纲摘要给用户
- 询问是否需要调整

### Phase 2: 写作
- 用户确认大纲后，调用 `chapter-writer` 代理

### Phase 3: 质量门
- 并行调用 `narrative-tracker` 和 `continuity-editor`
- PASS → 继续
- WARN → 告知用户，询问是否修改
- FAIL → 传给 chapter-writer 修改，最多重试 2 次

### Phase 4: 反 AI 改写
- 调用 `perplexity-improver` 代理
- 简报改写统计

### Phase 5: 人工审校
- 告知用户文件路径，等待确认
- 用户可编辑文件或口头反馈修改意见

### Phase 6: 定稿
- 用户确认后，调用 `state-updater` 代理
- 报告完成状态
- 询问是否发布到番茄小说（`/publish`）
