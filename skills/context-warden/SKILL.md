---
name: context-warden
description: Runtime defense against context rot. Use when a session grows long, before auto-compaction, when the agent starts re-reading files or losing track, or when token cost per turn climbs. Keeps the working set small via observation masking and compacts the transcript into a structured playbook instead of a raw dump. Trigger with /context-warden or "compact context", "context is bloated", "stop context rot".
version: "0.1.0"
user-invocable: true
metadata:
  emoji: "🧹"
---

<!-- OVERLAY:START -->
Keep the working set small. Context rot is real: accuracy drops 30-50% as irrelevant tokens pile up.
- Mask observations: keep file paths, signatures, error strings, and the diff in play. Drop raw tool dumps and superseded output.
- Do not re-read files already read this session unless they changed.
- Read only the slices you need (offset/limit, targeted grep), not whole files.
- Before auto-compaction, run /context-warden to compact into a structured playbook (decisions, open task, next step, file map), not a raw transcript dump.
- Summaries MUST preserve exact identifiers (names, signatures, error strings). Lossy summaries cause re-work.
Off: say "stop context-warden".
<!-- OVERLAY:END -->

# context-warden

Behavioral overlay plus an on-demand compaction tool. Defends the context window against "context rot": the measured drop in LLM accuracy as input tokens grow, even when the extra tokens are only loosely relevant.

## Why this exists (evidence)

- Context rot is architectural, not a training gap. Across 18 frontier models accuracy drops non-uniformly as input length grows, sometimes 30-50% well before the documented limit; the "lost in the middle" effect alone costs 30%+. Source: Chroma, "Context Rot" (2025).
- Letting context grow unchecked is the most expensive strategy and not the most accurate. Observation masking / summarization cut cost per instance by 50%+ with equal or higher solve rate in 3 of 5 SWE-bench Verified configs. Source: arXiv:2508.21433.
- Structured, evolving context ("playbook") beats raw history. ACE reports +10.6pp on agent tasks and -83.6% token cost vs strong baselines. Source: arXiv:2510.04618.
- Lossy summaries that drop variable names, signatures, or error strings force re-work; that is why this skill preserves exact identifiers.

## When to invoke

- The session is long and token cost per turn is climbing.
- The agent re-reads files it already read, repeats questions, or "forgets" earlier decisions.
- Right before an auto-compaction would fire, so the compaction is structured, not a raw transcript squeeze.
- After a big exploration phase, before starting implementation, to drop scaffolding noise.

## What it does

### 1. Observation masking (continuous, cheap)

Keep in the working set only what the current task needs:

KEEP:
- File paths and line ranges in play.
- Function/type signatures, public API names, config keys being edited.
- Error strings and stack frames for the bug being fixed.
- The current diff / patch and the failing test.
- Open decisions and the next concrete step.

DROP (or do not re-load):
- Raw tool dumps already acted on (full file prints, long command output).
- Superseded output (an earlier version of a file you have since edited).
- Exploration that led nowhere.
- Whole-file reads when a slice (offset/limit, targeted grep) answers the question.

Rule: never re-read a file already read this session unless it changed. Prefer targeted reads over full-file reads.

### 2. Structured compaction (on demand: /context-warden)

When asked to compact, produce a PLAYBOOK, not a transcript summary. The playbook is the new working context and must be lossless on identifiers:

```
## Context Playbook (compacted <YYYY-MM-DD>)

GOAL: <one line: what we are trying to achieve>

STATE: <where we are now, blunt>

DECISIONS (durable):
- <decision> -> <why>
- ...

FILE MAP (only files in scope):
- path/to/file.ext : <role; key symbols/signatures touched>
- ...

OPEN TASK: <the single next thing>
NEXT STEP: <concrete first action of that task>

VERIFY: <how we will know it worked: test/command/check>

DROPPED: <one line naming what noise was discarded, so nothing looks hidden>
```

Rules for compaction:
- Preserve exact names, signatures, paths, and error strings verbatim. Do not paraphrase identifiers.
- Prefer references over inlining: cite `file:line` instead of pasting the file.
- If a fact is uncertain, mark it `(unverified)` rather than dropping or asserting it.
- Keep it short. The point is a small, dense working set, not a second transcript.

### 3. Pre-compaction guard

Before a long auto-compaction, prefer running this skill so the retained context follows the playbook shape above. A raw auto-squeeze tends to keep recent verbose output and lose early decisions; the playbook keeps decisions and the next step, which is what continuation actually needs.

## Composes with

- `lean-response` and `token-audit` are static (prompt/skill level); context-warden is dynamic (runtime working set).
- `karpathy-coding` keeps changes surgical; context-warden keeps the context that informs them lean.
- Works under any model; the masking discipline matters most on long-horizon tasks and large repos.

## Off switch

Say "stop context-warden" to drop the overlay for the session.

## Honest limits

- This is discipline plus a compaction template, not a token meter. It does not measure the live context window; it reduces what fills it.
- The cited percentages come from the studies above on their benchmarks; your delta depends on task shape. Measure tokens-per-task with and without it before claiming a number.
