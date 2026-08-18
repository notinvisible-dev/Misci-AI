# Misci

An open-source AI coding agent with a desktop app, terminal UI, and 25 built-in skills.

Misci is a fork of [OpenCode](https://github.com/anomalyco/opencode) with rebranding, custom skills, and desktop packaging.

## Features

- **Desktop app** — Electron-based GUI for Linux, Windows, and macOS
- **Terminal UI** — TUI interface for the command line
- **25 built-in skills** — PDF, DOCX, PPTX, XLSX, algorithmic art, financial calculations, event planning, and more
- **Multi-provider** — Works with OpenAI, Anthropic, Google, xAI, Mistral, and OpenAI-compatible providers
- **MCP support** — Model Context Protocol integration for extending capabilities
- **Session management** — Persistent sessions with full conversation history
- **Plugin system** — Custom agents, skills, commands, and providers

## Built-in Skills

| Skill | Description |
|-------|-------------|
| algorithmic-art | Create generative art with p5.js |
| canvas-design | Create visual art in PNG/PDF |
| criticize | Critique topics and work |
| customize-misci | Edit Misci configuration |
| doc-coauthoring | Co-author documentation |
| docx | Create/edit Word documents |
| event-planning | Plan events from dinners to weddings |
| financial-calculator | Tax, loan, retirement, investment calculations |
| frontend-design | Visual design guidance for UI |
| humanizer | Rewrite text to sound less AI-generated |
| internal-comms | Write internal communications |
| learn | Structured learning and teaching |
| mcp-builder | Build MCP servers |
| memory | Persist user preferences across sessions |
| morning-briefing | Daily news and weather briefing |
| pdf | Create, edit, merge, split PDFs |
| pdf-reading | Read and extract content from PDFs |
| pptx | Create/edit PowerPoint presentations |
| setup-writing-style | Learn the user's writing voice |
| skill-creator | Create and optimize skills |
| slack-gif-creator | Create animated GIFs for Slack |
| theme-factory | Apply themes to artifacts |
| web-artifacts-builder | Build React/HTML artifacts |
| xlsx | Create/edit spreadsheets |
| youtube-subtitles | Summarize YouTube videos via subtitles |

## Quick Start

Download the latest release for your platform from [Releases](https://github.com/notinvisible-dev/Misci-AI/releases).

## Project Structure

```
packages/
  core/        — Plugin system, skills, agents, providers, sessions
  opencode/    — CLI, server, TUI, bundled skills
  desktop/     — Electron desktop app
  app/         — Web UI (SolidJS)
  tui/         — Terminal UI
  ui/          — Shared UI components and i18n
  protocol/    — API protocol definitions
  server/      — Backend server
  llm/         — LLM provider abstractions
  plugin/      — Plugin system types
  schema/      — Shared schema definitions
  sdk/         — JavaScript SDK
```

## Configuration

Misci reads configuration from `opencode.json` or `opencode.jsonc` in your project root. See the [docs](https://opencode.ai) for full configuration options.

## License

MIT
