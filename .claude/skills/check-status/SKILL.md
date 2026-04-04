---
name: check-status
description: 查看当前写作进度：章节号、暗线阶段、已埋线索数量、近 3 章摘要。
---

# 检查状态

快速展示当前写作进度。

## 执行

1. 读取 `clues/arc-progress.json`：
   - 当前章节号
   - 暗线阶段（setup/rising/climax）
   - 已埋暗线伏笔数量
   - 张力等级

2. 读取 `clues/tracker.json`：
   - 活跃真线索数量
   - 活跃红鲱鱼数量
   - 已解决线索数量

3. 读取最近 3 章摘要（`manuscript/summaries/` 下最新 3 个文件）

4. 以简洁表格展示：

```
📖 Story Snack 进度

章节：第 N 章已完成
暗线：{阶段名}（张力 {N}/10）
线索：{N} 条活跃 | {N} 条已解决
伏笔：{N} 个已埋设

--- 近 3 章回顾 ---
第 X 章：{摘要}
第 Y 章：{摘要}
第 Z 章：{摘要}
```
