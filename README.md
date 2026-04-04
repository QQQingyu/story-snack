# Story Snack 🍿

**AI 连载小说写作 + 自动投稿系统** | AI Serialized Novel Writing & Auto-Publishing System

每天一个故事，每个故事三口吃完。

---

## What is Story Snack?

Story Snack is a Claude Code skill that generates daily serialized mystery novel chapters and publishes them to [Fanqie Novel](https://writer.fanqienovel.com) (番茄小说). Each chapter is structured in three acts, designed to also work as three 1-minute short videos.

**Key features:**
- **6 specialized AI agents** working together: case design, writing, clue tracking, continuity checking, anti-AI rewriting, state management
- **Anti-AI detection system** with Chinese forbidden word lists and 9 rewriting techniques
- **Episodic mystery structure**: standalone cases per chapter with an overarching conspiracy arc
- **Three-act chapters** (3000-4000 words): 上(hook) → 中(investigation) → 下(twist) — each maps to a 1-min video
- **Semi-automatic workflow**: AI writes → quality gates → you review → auto-publish
- **Per-chapter state snapshots**: character knowledge, timeline, clue tracking, arc progress

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Story Snack                        │
├──────────┬──────────┬──────────┬─────────────────────┤
│  Bible   │ Writing  │ Quality  │    Publishing       │
│  System  │ Pipeline │ Gate     │    Pipeline          │
├──────────┼──────────┼──────────┼─────────────────────┤
│ 世界观   │ 案件设计  │ 反AI检测  │  番茄小说 MCP       │
│ 角色档案  │ 章节写作  │ 风格检查  │  (Playwright)       │
│ 暗线大纲  │ 连续性审计│ 角色一致性│                     │
│ 线索管理  │ 状态更新  │ 线索校验  │                     │
└──────────┴──────────┴──────────┴─────────────────────┘
```

### Agents

| Agent | Role | Model |
|-------|------|-------|
| `case-architect` | Designs daily case + 3-act outline | sonnet |
| `chapter-writer` | Writes full 3000-4000 word chapter | opus |
| `clue-manager` | Tracks clues, red herrings, arc foreshadowing | sonnet |
| `continuity-editor` | Audits timeline, character knowledge, world rules | sonnet |
| `perplexity-improver` | Rewrites AI-detectable patterns | sonnet |
| `state-updater` | Creates per-chapter state snapshots | sonnet |

### Daily Workflow

```
case-architect → chapter-writer → clue-manager + continuity-editor
       → perplexity-improver → YOU REVIEW → state-updater → publish
```

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/story-snack.git
cd story-snack
```

### 2. Fill Your Bible

Edit the template files in `bible/` with your story settings:

```bash
# Required - edit these before first run:
bible/style.md              # Writing style guide (pre-filled, customize if needed)
bible/characters/protagonist.md   # Your detective character
bible/characters/sidekick.md      # The sidekick
bible/universe/setting.md         # City, era, atmosphere
bible/universe/rules.md           # Mystery rules (pre-filled)
bible/arc/master-arc.md           # The overarching conspiracy
bible/arc/case-pool.md            # 10-15 case outlines
```

Or just tell Claude: `填充设定` and it will guide you through each file interactively.

### 3. Write Your First Chapter

Open Claude Code in the project directory and say:

```
写今天的章节
```

The orchestrator will walk you through the full pipeline.

### 4. (Optional) Setup Fanqie Publishing

```bash
cd mcp/fanqie && npm install && npm run build
```

Add the MCP server to your Claude Code config, then log in to writer.fanqienovel.com in a Playwright-managed browser.

## Customizing for Other Genres

Story Snack defaults to mystery/detective fiction, but you can adapt it to any genre:

1. **Replace `bible/`** — change characters, universe, style for your genre
2. **Modify `case-architect`** — rename to `episode-architect`, change the outline structure
3. **Adjust `clue-manager`** — for non-mystery genres, repurpose as a "plot thread tracker"
4. **Keep everything else** — continuity-editor, perplexity-improver, and state-updater are genre-agnostic

## Project Structure

```
story-snack/
├── CLAUDE.md                 # Master orchestrator
├── .claude/agents/           # 6 specialized agents
├── .claude/skills/           # Anti-AI detection skill
├── bible/                    # World, characters, style (read-only after setup)
├── state/                    # Per-chapter state snapshots
├── timeline/                 # Append-only global timeline
├── clues/                    # Clue tracker + arc progress
├── manuscript/               # Final chapters + summaries
├── .work/                    # Temporary working files
├── scripts/detection/        # Anti-AI detection resources
└── mcp/fanqie/              # Fanqie Novel auto-publish MCP
```

## Anti-AI Detection System

The `perplexity-improver` agent scans chapters for AI-detectable patterns:

- **80+ Chinese forbidden words/phrases** (AI high-frequency vocabulary)
- **6 pattern detectors**: uniform sentence structure, balanced paragraphs, empty descriptions, summary endings, direct emotion, post-dialogue explanation
- **9 rewriting techniques**: syntax inversion, fragmentation, colloquial injection, sensory substitution, rhythm breaking, narrative ellipsis, character voice bleeding, anti-cliche endings, silence/whitespace

## Credits

Inspired by:
- [Claude-Code-Novel-Writer](https://github.com/forsonny/Claude-Code-Novel-Writer) — multi-agent orchestrator pattern
- [Claude-Book](https://github.com/ThomasHoussin/Claude-Book) — bible system, perplexity-improver, state versioning

## License

MIT
