#!/usr/bin/env node
// context-warden - Claude Code SessionStart activation hook.
// Emits a LEAN context-discipline overlay (not the whole SKILL.md).
// The full compaction playbook lives in the skill and loads on demand via /context-warden.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Plugin runtime sets CLAUDE_PLUGIN_ROOT. Fall back to a user-skills install.
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

const candidates = [
  pluginRoot ? path.join(pluginRoot, 'skills', 'context-warden', 'SKILL.md') : null,
  path.join(claudeDir, 'skills', 'context-warden', 'SKILL.md'),
].filter(Boolean);

const DEFAULT_OVERLAY = [
  'Keep the working set small. Context rot is real: accuracy drops 30-50% as irrelevant tokens pile up.',
  '- Mask observations: keep file paths, signatures, error strings, and the diff in play. Drop raw tool dumps and superseded output.',
  '- Do not re-read files already read this session unless they changed.',
  '- Read only the slices you need (offset/limit, targeted grep), not whole files.',
  '- Before auto-compaction, run /context-warden to compact into a structured playbook (decisions, open task, next step, file map), not a raw transcript dump.',
  '- Summaries MUST preserve exact identifiers (names, signatures, error strings). Lossy summaries cause re-work.',
  'Off: say "stop context-warden".',
].join('\n');

function extractOverlay(md) {
  const m = md.match(/<!--\s*OVERLAY:START\s*-->([\s\S]*?)<!--\s*OVERLAY:END\s*-->/);
  return m ? m[1].trim() : null;
}

let overlay = DEFAULT_OVERLAY;
for (const p of candidates) {
  try {
    const md = fs.readFileSync(p, 'utf8');
    const ext = extractOverlay(md);
    if (ext) { overlay = ext; break; }
  } catch (e) { /* try next candidate */ }
}

process.stdout.write('CONTEXT-WARDEN ACTIVE\n\n' + overlay);
