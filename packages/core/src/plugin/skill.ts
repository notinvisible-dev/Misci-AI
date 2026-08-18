/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import { ConfigMarkdown } from "../config/markdown"
import customizeOpencodeContent from "./skill/customize-misci.md" with { type: "text" }
import algorithmicArtContent from "./skill/algorithmic-art/SKILL.md" with { type: "text" }
import canvasDesignContent from "./skill/canvas-design/SKILL.md" with { type: "text" }
import criticizeContent from "./skill/criticize/SKILL.md" with { type: "text" }
import docCoauthoringContent from "./skill/doc-coauthoring/SKILL.md" with { type: "text" }
import docxContent from "./skill/docx/SKILL.md" with { type: "text" }
import eventPlanningContent from "./skill/event-planning/SKILL.md" with { type: "text" }
import financialCalculatorContent from "./skill/financial-calculator/SKILL.md" with { type: "text" }
import frontendDesignContent from "./skill/frontend-design/SKILL.md" with { type: "text" }
import humanizerContent from "./skill/humanizer/SKILL.md" with { type: "text" }
import internalCommsContent from "./skill/internal-comms/SKILL.md" with { type: "text" }
import learnContent from "./skill/learn/SKILL.md" with { type: "text" }
import mcpBuilderContent from "./skill/mcp-builder/SKILL.md" with { type: "text" }
import memoryContent from "./skill/memory/SKILL.md" with { type: "text" }
import morningBriefingContent from "./skill/morning-briefing/SKILL.md" with { type: "text" }
import pdfContent from "./skill/pdf/SKILL.md" with { type: "text" }
import pdfReadingContent from "./skill/pdf-reading/SKILL.md" with { type: "text" }
import pptxContent from "./skill/pptx/SKILL.md" with { type: "text" }
import setupWritingStyleContent from "./skill/setup-writing-style/SKILL.md" with { type: "text" }
import skillCreatorContent from "./skill/skill-creator/SKILL.md" with { type: "text" }
import slackGifCreatorContent from "./skill/slack-gif-creator/SKILL.md" with { type: "text" }
import themeFactoryContent from "./skill/theme-factory/SKILL.md" with { type: "text" }
import webArtifactsBuilderContent from "./skill/web-artifacts-builder/SKILL.md" with { type: "text" }
import xlsxContent from "./skill/xlsx/SKILL.md" with { type: "text" }
import youtubeSubtitlesContent from "./skill/youtube-subtitles/SKILL.md" with { type: "text" }

export const CustomizeOpencodeContent = customizeOpencodeContent

const embedded = (location: string, content: string): SkillV2.EmbeddedSource | undefined => {
  const markdown = ConfigMarkdown.parseOption(content)
  if (!markdown) return undefined
  const { name, description } = markdown.data as { name?: string; description?: string }
  if (!name || !description) return undefined
  return SkillV2.EmbeddedSource.make({
    type: "embedded",
    skill: SkillV2.Info.make({
      name,
      description,
      location: AbsolutePath.make(location),
      content: markdown.content,
    }),
  })
}

const sources = [
  SkillV2.EmbeddedSource.make({
    type: "embedded",
    skill: SkillV2.Info.make({
      name: "customize-misci",
      description:
        "Use ONLY when the user is editing or creating Misci's own configuration: opencode.json, opencode.jsonc, files under .opencode/, or files under ~/.config/opencode/. Also use when creating or fixing Misci agents, subagents, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring Misci itself.",
      location: AbsolutePath.make("/builtin/customize-misci.md"),
      content: CustomizeOpencodeContent,
    }),
  }),
  embedded("/builtin/algorithmic-art/SKILL.md", algorithmicArtContent),
  embedded("/builtin/canvas-design/SKILL.md", canvasDesignContent),
  embedded("/builtin/criticize/SKILL.md", criticizeContent),
  embedded("/builtin/doc-coauthoring/SKILL.md", docCoauthoringContent),
  embedded("/builtin/docx/SKILL.md", docxContent),
  embedded("/builtin/event-planning/SKILL.md", eventPlanningContent),
  embedded("/builtin/financial-calculator/SKILL.md", financialCalculatorContent),
  embedded("/builtin/frontend-design/SKILL.md", frontendDesignContent),
  embedded("/builtin/humanizer/SKILL.md", humanizerContent),
  embedded("/builtin/internal-comms/SKILL.md", internalCommsContent),
  embedded("/builtin/learn/SKILL.md", learnContent),
  embedded("/builtin/mcp-builder/SKILL.md", mcpBuilderContent),
  embedded("/builtin/memory/SKILL.md", memoryContent),
  embedded("/builtin/morning-briefing/SKILL.md", morningBriefingContent),
  embedded("/builtin/pdf/SKILL.md", pdfContent),
  embedded("/builtin/pdf-reading/SKILL.md", pdfReadingContent),
  embedded("/builtin/pptx/SKILL.md", pptxContent),
  embedded("/builtin/setup-writing-style/SKILL.md", setupWritingStyleContent),
  embedded("/builtin/skill-creator/SKILL.md", skillCreatorContent),
  embedded("/builtin/slack-gif-creator/SKILL.md", slackGifCreatorContent),
  embedded("/builtin/theme-factory/SKILL.md", themeFactoryContent),
  embedded("/builtin/web-artifacts-builder/SKILL.md", webArtifactsBuilderContent),
  embedded("/builtin/xlsx/SKILL.md", xlsxContent),
  embedded("/builtin/youtube-subtitles/SKILL.md", youtubeSubtitlesContent),
].filter((source): source is SkillV2.EmbeddedSource => source !== undefined)

export const EmbeddedSources = sources

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      for (const source of sources) draft.source(source)
    })
  }),
})
