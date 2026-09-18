import { ZenData } from "@opencode-ai/console-core/model.js"
import {
  fromAnthropicChunk,
  fromAnthropicRequest,
  fromAnthropicResponse,
  toAnthropicChunk,
  toAnthropicRequest,
  toAnthropicResponse,
} from "./anthropic"
import {
  fromOpenaiChunk,
  fromOpenaiRequest,
  fromOpenaiResponse,
  toOpenaiChunk,
  toOpenaiRequest,
  toOpenaiResponse,
} from "./openai"
import {
  fromOaCompatibleChunk,
  fromOaCompatibleRequest,
  fromOaCompatibleResponse,
  toOaCompatibleChunk,
  toOaCompatibleRequest,
  toOaCompatibleResponse,
} from "./openai-compatible"

export type UsageInfo = {
  inputTokens: number
  outputTokens: number
  reasoningTokens?: number
  cacheReadTokens?: number
  cacheWrite5mTokens?: number
  cacheWrite1hTokens?: number
}

export type ProviderHelper = (input: {
  reqModel: string
  providerModel: string
  adjustCacheUsage?: boolean
  workspaceID?: string
}) => {
  format: ZenData.Format
  modifyUrl: (providerApi: string, isStream?: boolean) => string
  modifyHeaders: (headers: Headers, apiKey: string, stickyId: string) => void
  modifyBody: (body: Record<string, any>) => Record<string, any>
  createBinaryStreamDecoder: () => ((chunk: Uint8Array) => Uint8Array | undefined) | undefined
  createUsageParser: () => {
    parse: (chunk: string) => void
    retrieve: () => any
  }
  extractUsage: (response: any) => any
  normalizeUsage: (usage: any) => UsageInfo
}

export interface CommonMessage {
  role: "system" | "user" | "assistant" | "tool"
  content?: string | Array<CommonContentPart>
  tool_call_id?: string
  tool_calls?: CommonToolCall[]
}

export interface CommonContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: { url: string }
}

export interface CommonToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface CommonTool {
  type: "function"
  function: {
    name: string
    description?: string
    parameters?: Record<string, any>
  }
}

export interface CommonUsage {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  prompt_tokens?: number
  completion_tokens?: number
  cache_read_input_tokens?: number
  cache_creation?: {
    ephemeral_5m_input_tokens?: number
    ephemeral_1h_input_tokens?: number
  }
  input_tokens_details?: {
    cached_tokens?: number
  }
  output_tokens_details?: {
    reasoning_tokens?: number
  }
}

export interface CommonRequest {
  model: string
  max_tokens?: number
  temperature?: number
  top_p?: number
  stop?: string | string[]
  messages: CommonMessage[]
  stream?: boolean
  tools?: CommonTool[]
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } }
}

export interface CommonResponse {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: "assistant"
      content?: string
      tool_calls?: CommonToolCall[]
    }
    finish_reason: "stop" | "tool_calls" | "length" | "content_filter" | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    prompt_tokens_details?: { cached_tokens?: number }
  }
}

export interface CommonChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: "assistant"
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: "function"
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: "stop" | "tool_calls" | "length" | "content_filter" | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    prompt_tokens_details?: { cached_tokens?: number }
  }
}

export function buildCostChunk(format: ZenData.Format, cost: string): string {
  switch (format) {
    case "anthropic":
      return `event: ping\ndata: ${JSON.stringify({ type: "ping", cost })}\n\n`
    case "openai":
      return `event: ping\ndata: ${JSON.stringify({ type: "ping", cost })}\n\n`
    case "oa-compat":
      return `data: ${JSON.stringify({ choices: [], cost })}\n\n`
    default:
      return `data: ${JSON.stringify({ type: "ping", cost })}\n\n`
  }
}

export function createBodyConverter(from: ZenData.Format, to: ZenData.Format) {
  return (body: any): any => {
    if (from === to) return body

    let raw: CommonRequest
    if (from === "anthropic") raw = fromAnthropicRequest(body)
    else if (from === "openai") raw = fromOpenaiRequest(body)
    else raw = fromOaCompatibleRequest(body)

    if (to === "anthropic") return toAnthropicRequest(raw)
    if (to === "openai") return toOpenaiRequest(raw)
    if (to === "oa-compat") return toOaCompatibleRequest(raw)
  }
}

export function createStreamPartConverter(from: ZenData.Format, to: ZenData.Format) {
  return (part: any): any => {
    if (from === to) return part

    let raw: CommonChunk | string
    if (from === "anthropic") raw = fromAnthropicChunk(part)
    else if (from === "openai") raw = fromOpenaiChunk(part)
    else raw = fromOaCompatibleChunk(part)

    // If result is a string (error case), pass it through
    if (typeof raw === "string") return raw

    if (to === "anthropic") return toAnthropicChunk(raw)
    if (to === "openai") return toOpenaiChunk(raw)
    if (to === "oa-compat") return toOaCompatibleChunk(raw)
  }
}

export function createResponseConverter(from: ZenData.Format, to: ZenData.Format) {
  return (response: any): any => {
    if (from === to) return response

    let raw: CommonResponse
    if (from === "anthropic") raw = fromAnthropicResponse(response)
    else if (from === "openai") raw = fromOpenaiResponse(response)
    else raw = fromOaCompatibleResponse(response)

    if (to === "anthropic") return toAnthropicResponse(raw)
    if (to === "openai") return toOpenaiResponse(raw)
    if (to === "oa-compat") return toOaCompatibleResponse(raw)
  }
}

/**
 * True when the caller asked for "no reasoning" (chatting) in the request body,
 * regardless of what the model catalog advertises.
 */
export function isNoReasoningRequest(format: ZenData.Format, body: Record<string, any>): boolean {
  switch (format) {
    case "oa-compat":
      return (
        body.thinking?.type === "disabled" ||
        body.reasoning_effort === "none" ||
        body.reasoning?.effort === "none"
      )
    case "anthropic":
      return body.thinking?.type === "disabled" || body.effort === "none"
    case "openai":
      return body.reasoning_effort === "none" || body.reasoning?.effort === "none"
    case "google":
      return body.generationConfig?.thinkingConfig?.thinkingBudget === 0
  }
}

/** Forces reasoning off on the outbound request body for a no-reasoning request. */
export function forceDisableReasoning(body: Record<string, any>, format: ZenData.Format) {
  switch (format) {
    case "oa-compat":
      body.thinking = { type: "disabled" }
      delete body.reasoning_effort
      delete body.reasoning
      break
    case "anthropic":
      delete body.thinking
      delete body.effort
      break
    case "openai":
      delete body.reasoning_effort
      delete body.reasoning
      break
    case "google":
      if (body.generationConfig?.thinkingConfig) delete body.generationConfig.thinkingConfig
      delete body.thinkingConfig
      break
  }
  return body
}

/** Strips reasoning artifacts from a non-streaming response. */
export function stripReasoningFromResponse(response: Record<string, any>, format: ZenData.Format) {
  switch (format) {
    case "oa-compat":
    case "openai":
      for (const choice of response?.choices ?? []) {
        if (choice.message) {
          delete choice.message.reasoning_content
          delete choice.message.reasoning
        }
      }
      break
    case "anthropic":
      if (Array.isArray(response?.content))
        response.content = response.content.filter((block: Record<string, any>) => block.type !== "thinking")
      break
    case "google":
      for (const candidate of response?.candidates ?? []) {
        if (Array.isArray(candidate.content?.parts))
          candidate.content.parts = candidate.content.parts.filter((part: Record<string, any>) => !part.thought)
      }
      break
  }
  return response
}

/** Strips reasoning artifacts from a single SSE part, returning "" to drop it. */
export function stripReasoningStreamPart(part: string, format: ZenData.Format): string {
  if (!part.startsWith("data: ")) return part

  let json: any
  try {
    json = JSON.parse(part.slice(6))
  } catch {
    return part
  }

  switch (format) {
    case "oa-compat":
    case "openai":
      for (const choice of json?.choices ?? []) {
        if (choice.delta) {
          delete choice.delta.reasoning_content
          delete choice.delta.reasoning
        }
        if (choice.message) {
          delete choice.message.reasoning_content
          delete choice.message.reasoning
        }
      }
      return json.error ? part : `data: ${JSON.stringify(json)}`
    case "anthropic":
      if (json.type === "content_block_start" && json.content_block?.type === "thinking") return ""
      if (json.type === "content_block_delta" && json.delta?.type === "thinking_delta") return ""
      return part
    case "google": {
      let changed = false
      for (const candidate of json?.candidates ?? []) {
        if (Array.isArray(candidate.content?.parts)) {
          const kept = candidate.content.parts.filter((item: Record<string, any>) => !item.thought)
          if (kept.length !== candidate.content.parts.length) {
            candidate.content.parts = kept
            changed = true
          }
        }
      }
      return changed ? `data: ${JSON.stringify(json)}` : part
    }
  }
}
