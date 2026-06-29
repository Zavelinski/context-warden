# context-warden

Runtime context-rot defense for Claude Code. A lean session overlay plus an on-demand compaction skill that keeps the working set small and turns "compact" into a structured playbook instead of a raw transcript squeeze.

## Why

Context rot is real and architectural: across 18 frontier models, accuracy drops 30-50% as input tokens grow, even when the extra tokens are only loosely relevant ([Chroma, 2025](https://www.trychroma.com/research/context-rot)). Letting context grow unchecked is the most expensive strategy and not the most accurate; observation masking / summarization cut cost per instance 50%+ with equal or higher solve rate in 3 of 5 SWE-bench Verified configs ([arXiv:2508.21433](https://arxiv.org/html/2508.21433v1)). Structured, evolving context beats raw history: ACE reports +10.6pp on agent tasks and -83.6% token cost ([arXiv:2510.04618](https://arxiv.org/abs/2510.04618)).

context-warden brings that discipline into the session.

## What you get

- **SessionStart overlay** (lean, ~7 lines): keep paths/signatures/errors/diff, drop raw tool dumps, do not re-read unchanged files, read slices not whole files.
- **`/context-warden` skill**: compacts the transcript into a structured PLAYBOOK (goal, decisions, file map, open task, next step, verify) that preserves exact identifiers, so continuation does not lose early decisions.

The overlay is intentionally short, emitting the whole skill every session would itself be context rot.

## Install (Claude Code, local directory marketplace)

```jsonc
// ~/.claude/settings.json
"extraKnownMarketplaces": {
  "context-warden": { "source": { "source": "directory", "path": "C:\\Users\\<you>\\context-warden" } }
},
"enabledPlugins": {
  "context-warden@context-warden": true
}
```

Or, after publishing to GitHub:

```jsonc
"extraKnownMarketplaces": {
  "context-warden": { "source": { "source": "github", "repo": "<you>/context-warden" } }
}
```

Restart Claude Code. You should see `CONTEXT-WARDEN ACTIVE` at session start.

## Usage

- It is on automatically (overlay). 
- Run `/context-warden` (or say "compact context") before a long auto-compaction or when the agent starts re-reading files.
- Say "stop context-warden" to drop it for the session.

## Limits

This is discipline plus a compaction template, not a token meter. The cited percentages are from the studies above on their benchmarks; measure tokens-per-task with and without it before claiming a number.

## License

MIT
