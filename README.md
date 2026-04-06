# Story Snack

Multi-agent serialized novel writing. One command per chapter, zero copy-paste.

## What is this?

Story Snack is a genre-agnostic writing framework that turns "write today's chapter" into a full production pipeline. Six specialized agents handle the heavy lifting — plotting, writing, fact-checking, rewriting — while you stay in the driver's seat.

Works with any genre: mystery, romance, fantasy, sci-fi, urban fiction, historical, horror, and beyond. Genre-specific rules are configured during an interactive onboarding flow.

```
You: "Write today's chapter"

  Chapter Architect    →  designs the core event & 3-act outline
  Chapter Writer       →  drafts 3000-4000 words
  Narrative Tracker    →  validates plot thread consistency   ┐ parallel
  Continuity Editor    →  audits timeline & characters        ┘ quality gate
  Perplexity Improver  →  scrubs AI-detectable patterns
  State Updater        →  archives & updates progress

  You review → finalize → publish
```

## Quick Start

**1. Install the skill**

Tell your Claude Code agent:

> Install the skill from `github.com/QQQingyu/story-snack`

**2. Create a novel**

> Create a new novel called "My Story"

The agent scaffolds everything, then walks you through `/fill-bible` to set up your genre, world, characters, and story arc.

**3. Write**

```bash
cd my-story
claude
```

Say "write today's chapter" or `/write-chapter`. That's it.

## The Pipeline

Every chapter goes through 8 phases before it's done:

| Phase | What happens |
|-------|-------------|
| **Prepare** | Read progress, determine chapter number, brief current state |
| **Design** | `chapter-architect` generates a 3-act outline — you approve or tweak |
| **Write** | `chapter-writer` produces a full draft |
| **Quality Gate** | `narrative-tracker` + `continuity-editor` run in parallel — must pass |
| **Anti-AI** | `perplexity-improver` rewrites to reduce detectable patterns |
| **Review** | You read, edit, confirm |
| **Finalize** | `state-updater` archives the chapter and updates all state |
| **Publish** | One-click publish to [Fanqie Novel](https://fanqienovel.com) (optional) |

## Agents

| Agent | Job | Model |
|-------|-----|-------|
| `chapter-architect` | Designs core events and 3-act outlines | Sonnet |
| `chapter-writer` | Writes full chapters (3000-4000 words) | Opus |
| `narrative-tracker` | Tracks foreshadowing, misdirection, arc threads | Sonnet |
| `continuity-editor` | Catches timeline errors, character knowledge leaks | Sonnet |
| `perplexity-improver` | Lowers AI detectability without losing voice | Sonnet |
| `state-updater` | Snapshots state, updates timeline, archives chapters | Sonnet |

## Commands

| Command | What it does |
|---------|-------------|
| `/write-chapter` | Full daily writing pipeline |
| `/fill-bible` | Guided world-building setup (with genre selection) |
| `/check-status` | Current chapter, arc phase, recent summaries |
| `/check-threads` | All narrative threads: foreshadowing, misdirection, resolved |
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
    style.md             ← writing style guide (genre-specific rules generated during setup)
    characters/          ← protagonist, sidekick, recurring cast
    arc/                 ← master arc, event pool
    universe/            ← setting, rules
  clues/                 ← narrative thread tracker & arc progress
  state/                 ← per-chapter state snapshots
  timeline/              ← append-only global timeline
  manuscript/            ← finalized chapters & summaries
  scripts/               �� quality detection tools
  .work/                 ← scratch space
```

## Design Principles

- **You're the author** — every chapter needs your sign-off before it's final
- **Genre-agnostic** — the framework provides structure; you provide the soul
- **Quality gates can't be skipped** — plot thread consistency and continuity checks are mandatory
- **Three-act structure** — every chapter follows top / middle / bottom, no exceptions
- **State is versioned** — each chapter gets its own snapshot, so you can always look back
- **Anti-AI by default** — every chapter passes through perplexity reduction before review

## License

[MIT](LICENSE)
