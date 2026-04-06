---
name: publish
description: 将最新章节发布到番茄小说。自动检查 MCP 配置，检查登录状态，读取终稿，发布并截图确认。
---

# 发布到番茄小说

将最新完成的章节发布到番茄小说作者平台。

## 前置检查

1. 读取 `clues/arc-progress.json` 获取当前章节号 N
2. 确认 `manuscript/chapters/chapter-{NNN}.md` 存在（章节已定稿）
3. 如果文件不存在，提示用户先运行 `/write-chapter`

## MCP 就绪检查

在发布前，确保 fanqie MCP 工具可用：

1. 尝试调用 `fanqie_check_login` — 如果工具可用则跳过后续步骤
2. 如果工具不可用，自动修复：
   a. 检查 `mcp/fanqie/dist/index.js` 是否存在
      - 不存在 → 从 story-snack 源仓库复制 `mcp/fanqie/`，运行 `cd mcp/fanqie && npm install && npm run build`
      - 已存在 → 跳到下一步
   b. 检查是否存在项目级 MCP 配置文件（`.claude/mcp.json`）
      - 不存在 → 创建 `.claude/mcp.json`：
        ```json
        {
          "mcpServers": {
            "fanqie": {
              "command": "node",
              "args": ["{当前项目绝对路径}/mcp/fanqie/dist/index.js"]
            }
          }
        }
        ```
      - 已存在但没有 fanqie 条目 → 追加 fanqie 配置
   c. 告知用户：「MCP 配置已创建，请重启会话（Cmd+R 或重新进入项目目录）后再次运行 /publish」

## 发布流程

### 1. 检查登录
- 调用 `fanqie_check_login`
- MCP 会自动启动 Chrome（使用独立 profile `~/.chrome-fanqie`，不影响用户正常浏览器）
- 未登录 → 截图显示登录页，提示用户在自动打开的 Chrome 中手动登录（只需首次）
- 已登录 → 继续（固定 profile 保持登录态，后续无需再登录）

### 2. 读取章节并直接发布
- 读取 `manuscript/chapters/chapter-{NNN}.md`
- 提取章节标题和正文
- **不需要向用户确认标题或内容，直接发布**
- 调用 `fanqie_publish_chapter`，传入 bookId、标题、正文

### 3. 截图确认
- 调用 `fanqie_screenshot` 截图确认
- 展示截图给用户
- 报告发布结果（成功/失败）

## bookId 获取

- 首次发布时需要 bookId。优先从 memory 中读取，没有则问用户
- bookId 在番茄作者后台的作品 URL 中：`https://fanqienovel.com/main/writer/book/{bookId}`

## 注意事项

- **发布流程全自动，不要中途暂停确认** — 读取章节后直接调用发布 API
- 如果发布失败，截图报错页面供排查
