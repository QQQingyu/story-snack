# Story Snack

Multi-agent serialized novel writing, powered by [Claude Code](https://claude.ai/claude-code). One command per chapter, zero copy-paste.

## What is this?

Story Snack is a writing framework that turns "write today's chapter" into a full production pipeline. Six specialized agents handle the heavy lifting — plotting, writing, fact-checking, rewriting — while you stay in the driver's seat.

```
You: "Write today's chapter"

  Case Architect    →  plots the case & 3-act outline
  Chapter Writer    →  drafts 3000-4000 words
  Clue Manager      →  validates clue consistency     ┐ parallel
  Continuity Editor →  audits timeline & characters    ┘ quality gate
  Perplexity Improver → scrubs AI-detectable patterns
  State Updater     →  archives & updates progress

  You review → finalize → publish
```

## Quick Start

**1. Install the skill**

Tell your Claude Code agent:

> Install the skill from `github.com/QQQingyu/story-snack`

**2. Create a novel**

> Create a new novel called "Rust Harbor Files"

The agent scaffolds everything, then walks you through `/fill-bible` to set up your world, characters, and story arc.

**3. Write**

```bash
cd rust-harbor-files
claude
```

Say "write today's chapter" or `/write-chapter`. That's it.

## The Pipeline

Every chapter goes through 8 phases before it's done:

| Phase | What happens |
|-------|-------------|
| **Prepare** | Read progress, determine chapter number, brief current state |
| **Case Design** | `case-architect` generates a 3-act outline — you approve or tweak |
| **Write** | `chapter-writer` produces a full draft |
| **Quality Gate** | `clue-manager` + `continuity-editor` run in parallel — must pass |
| **Anti-AI** | `perplexity-improver` rewrites to reduce detectable patterns |
| **Review** | You read, edit, confirm |
| **Finalize** | `state-updater` archives the chapter and updates all state |
| **Publish** | One-click publish to [Fanqie Novel](https://fanqienovel.com) (optional) |

## Agents

| Agent | Job | Model |
|-------|-----|-------|
| `case-architect` | Plots daily cases and 3-act outlines | Sonnet |
| `chapter-writer` | Writes full chapters (3000-4000 words) | Opus |
| `clue-manager` | Tracks clues, red herrings, arc foreshadowing | Sonnet |
| `continuity-editor` | Catches timeline errors, character knowledge leaks | Sonnet |
| `perplexity-improver` | Lowers AI detectability without losing voice | Sonnet |
| `state-updater` | Snapshots state, updates timeline, archives chapters | Sonnet |

## Commands

| Command | What it does |
|---------|-------------|
| `/write-chapter` | Full daily writing pipeline |
| `/fill-bible` | Guided world-building setup |
| `/check-status` | Current chapter, arc phase, recent summaries |
| `/check-clues` | All clues: active, red herrings, resolved |
| `/publish` | Publish latest chapter to Fanqie Novel |

## Project Structure

After creating a novel, you get:

```
my-novel/
  CLAUDE.md              ← orchestrator brain
  .claude/
    agents/              ← 6 agent definitions
    skills/              ← 6 skill definitions
  bible/                 ← world & characters (read-only after setup)
    style.md             ← writing style guide
    characters/          ← protagonist, sidekick, recurring cast
    arc/                 ← master arc, case pool
    universe/            ← setting, rules
  clues/                 ← clue tracker & arc progress
  state/                 ← per-chapter state snapshots
  timeline/              ← append-only global timeline
  manuscript/            ← finalized chapters & summaries
  scripts/               ← quality detection tools
  .work/                 ← scratch space
```

## Design Principles

- **You're the author** — every chapter needs your sign-off before it's final
- **Quality gates can't be skipped** — clue consistency and continuity checks are mandatory, even when you're in a hurry
- **Three-act structure** — every chapter follows top / middle / bottom, no exceptions
- **State is versioned** — each chapter gets its own snapshot, so you can always look back
- **Anti-AI by default** — every chapter passes through perplexity reduction before review

## License

[MIT](LICENSE)
