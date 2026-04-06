# Story Snack

A multi-agent framework for writing serialized novels with AI. Built for [Claude Code](https://claude.ai/claude-code).

Story Snack orchestrates 6 specialized agents through a structured pipeline — from world-building to daily chapter generation, quality review, anti-AI rewriting, and publishing.

## How It Works

```
User: "Write today's chapter"

  Case Architect    →  designs the case & 3-act outline
  Chapter Writer    →  writes 3000-4000 word chapter
  Clue Manager      →  validates clue consistency     ┐ parallel
  Continuity Editor →  audits timeline & character     ┘ quality gate
  Perplexity Improver → reduces AI-detectable patterns
  State Updater     →  archives & updates progress

  Human review → Finalize → Publish (optional)
```

## Quick Start

### 1. Install the skill

Tell your Claude Code agent:

> Install the skill from `github.com/QQQingyu/story-snack`

### 2. Create a new novel

> Create a new novel called "My Novel"

The agent will scaffold the project, then guide you through `/fill-bible` to set up your world, characters, and story arc.

### 3. Write

```bash
cd my-novel
claude
```

Then just say "write today's chapter" or use `/write-chapter`.

## Writing Pipeline

Each chapter goes through 8 phases:

| Phase | What happens |
|-------|-------------|
| Prepare | Read progress, determine chapter number, brief the author |
| Case Design | `case-architect` generates a 3-act outline; author approves |
| Write | `chapter-writer` produces a full draft |
| Quality Gate | `clue-manager` + `continuity-editor` run in parallel |
| Anti-AI | `perplexity-improver` rewrites to reduce detectable patterns |
| Human Review | Author reads, edits, confirms |
| Finalize | `state-updater` archives chapter and updates all state |
| Publish | Optional one-click publish to supported platforms |

## Agents

| Agent | Role | Model |
|-------|------|-------|
| `case-architect` | Designs daily cases and 3-act outlines | Sonnet |
| `chapter-writer` | Writes full chapters (3000-4000 words) | Opus |
| `clue-manager` | Tracks clues, red herrings, and arc foreshadowing | Sonnet |
| `continuity-editor` | Audits character knowledge, timeline, and world consistency | Sonnet |
| `perplexity-improver` | Rewrites to lower AI detectability | Sonnet |
| `state-updater` | Updates state snapshots, timeline, and archives | Sonnet |

## Commands

| Command | Description |
|---------|-------------|
| `/write-chapter` | Run the full daily writing pipeline |
| `/fill-bible` | Guided world-building setup |
| `/check-status` | View current chapter, arc phase, recent summaries |
| `/check-clues` | View all clues: active, red herrings, resolved |
| `/publish` | Publish latest chapter to Fanqie Novel |

## Project Structure

After creating a novel, your project directory looks like this:

```
my-novel/
  CLAUDE.md              ← orchestrator instructions
  .claude/
    agents/              ← 6 agent definitions
    skills/              ← 6 skill definitions
  bible/                 ← world & character settings (read-only after setup)
    style.md             ← writing style guide
    characters/          ← protagonist, sidekick, recurring cast
    arc/                 ← master arc outline, case pool
    universe/            ← setting, rules
  clues/                 ← clue tracker & arc progress
  state/                 ← per-chapter state snapshots
  timeline/              ← append-only global timeline
  manuscript/            ← finalized chapters & summaries
  scripts/               ← quality detection tools
  .work/                 ← temporary working files
```

## Publishing

Story Snack includes an MCP server for publishing to [Fanqie Novel](https://fanqienovel.com) (番茄小说). To set it up:

```bash
cd mcp/fanqie
npm install
npm run build
```

Then configure in your Claude MCP settings. See `skills/publish/SKILL.md` for details.

## Design Principles

- **Human-in-the-loop** — Every chapter requires author review before finalizing
- **Quality gates are mandatory** — Clue consistency and continuity checks cannot be skipped
- **Three-act structure** — Every chapter follows a top/middle/bottom structure
- **State is versioned** — Each chapter gets its own state snapshot for rollback
- **Anti-AI by default** — Every chapter passes through perplexity reduction before review

## License

[AGPL-3.0](LICENSE)
