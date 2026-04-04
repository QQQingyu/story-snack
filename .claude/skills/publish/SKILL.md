---
name: publish
description: 将最新章节发布到番茄小说。检查登录状态，读取终稿，自动发布并截图确认。
---

# 发布到番茄小说

将最新完成的章节发布到番茄小说作者平台。

## 前置检查

1. 读取 `clues/arc-progress.json` 获取当前章节号 N
2. 确认 `manuscript/chapters/chapter-{NNN}.md` 存在（章节已定稿）
3. 如果文件不存在，提示用户先运行 `/write-chapter`

## 发布流程

### 1. 检查登录
- 调用 `fanqie_check_login`
- 未登录 → 截图显示登录页，提示用户在浏览器中手动登录
- 已登录 → 继续

### 2. 读取章节
- 读取 `manuscript/chapters/chapter-{NNN}.md`
- 提取章节标题和正文

### 3. 发布
- 调用 `fanqie_publish_chapter`，传入 bookId、标题、正文
- bookId 从用户处获取（首次需要用户提供，后续记住）

### 4. 确认
- 调用 `fanqie_screenshot` 截图确认
- 展示截图给用户
- 报告发布结果

## 注意事项

- 首次发布需要用户提供 bookId（在番茄作者后台创建作品后从 URL 获取）
- 发布前会展示章节标题供用户确认
- 如果发布失败，截图报错页面供排查
