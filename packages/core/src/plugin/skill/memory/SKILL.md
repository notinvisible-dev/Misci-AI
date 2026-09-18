---
name: memory
description: Persist user identity and preferences across sessions. Update the user's memory profile when they share personal information, and refresh existing entries when details change.
---

# Memory

Misci keeps a persistent memory file at `~/.config/opencode/memory/profile.md` that carries user identity and preferences across all sessions.

## At conversation start

The server reads the profile file and injects it into the system context automatically when a session starts. Do not read the file yourself — it is already available.

## When the user shares personal information

Any time the user tells you something about themselves — their name, where they live, what they do, what they prefer, how they like things done, opinions, habits, recurring details — update the memory file.

- If the file exists, use the Edit tool to add or update entries.
- If the file does not exist, create the directory (`~/.config/opencode/memory/`) with Bash `mkdir -p`, then write the file.
- Keep entries concise: one line per fact.
- Group related facts under short headings (e.g. `## Identity`, `## Preferences`, `## Projects`).
- Remove or rewrite outdated entries instead of letting them accumulate.
- Never store secrets: no passwords, tokens, API keys, or financial account numbers.

## Example profile structure

```markdown
## Identity
- Name: Alex
- Location: Berlin, Germany
- Occupation: Backend engineer

## Preferences
- Prefers terse responses
- Uses dark mode everywhere
- Favorite languages: Rust, TypeScript

## Projects
- Building a self-hosted analytics tool called Metrika
- Monorepo at ~/projects/metrika
```