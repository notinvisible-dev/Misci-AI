export * as SystemContextBuiltIns from "./builtins"

import { join } from "path"
import { makeLocationNode } from "../effect/app-node"
import { DateTime, Effect, Layer, Schema } from "effect"
import { Location } from "../location"
import { SystemContext } from "./index"
import { InstructionContext } from "../instruction-context"
import { SystemContextRegistry } from "./registry"
import { FSUtil } from "../fs-util"
import { Global } from "../global"

const builtIns = Layer.effectDiscard(
  Effect.gen(function* () {
    const location = yield* Location.Service
    const registry = yield* SystemContextRegistry.Service
    const fs = yield* FSUtil.Service
    const global = yield* Global.Service
    const environment = [
      "<env>",
      `  Working directory: ${location.directory}`,
      `  Workspace root folder: ${location.project.directory}`,
      `  Is directory a git repo: ${location.vcs?.type === "git" ? "yes" : "no"}`,
      `  Platform: ${process.platform}`,
      "</env>",
    ].join("\n")
    const context = SystemContext.combine([
      SystemContext.make({
        key: SystemContext.Key.make("core/environment"),
        codec: Schema.toCodecJson(Schema.String),
        load: Effect.succeed(environment),
        baseline: (environment) =>
          ["Here is some useful information about the environment you are running in:", environment].join("\n"),
        update: (_previous, environment) => ["The environment you are running in is now:", environment].join("\n"),
      }),
      SystemContext.make({
        key: SystemContext.Key.make("core/date"),
        codec: Schema.toCodecJson(Schema.String),
        load: DateTime.nowAsDate.pipe(Effect.map((date) => date.toDateString())),
        baseline: (date) => `Today's date: ${date}`,
        update: (_previous, date) => `Today's date is now: ${date}`,
      }),
    ])

    yield* registry.register({ key: SystemContext.Key.make("core/builtins"), load: Effect.succeed(context) })

    const memoryKey = SystemContext.Key.make("misci/memory")
    const memory = yield* fs
      .readFileStringSafe(join(global.config, "memory", "profile.md"))
      .pipe(
        Effect.map((content) => {
          if (content === undefined || content.trim() === "") return SystemContext.empty
          return SystemContext.make({
            key: memoryKey,
            codec: Schema.toCodecJson(Schema.String),
            load: Effect.succeed(content),
            baseline: (content) => ["Here is the user's saved profile:", content].join("\n\n"),
            update: (_previous, content) =>
              ["The user's saved profile has been updated:", content].join("\n\n"),
            removed: () => "The user's saved profile is no longer available.",
          })
        }),
        Effect.catch(() => Effect.succeed(SystemContext.empty)),
      )
    yield* registry.register({ key: memoryKey, load: Effect.succeed(memory) })
  }),
)

export const node = makeLocationNode({
  name: "system-context-builtins",
  layer: builtIns,
  deps: [Location.node, SystemContextRegistry.node, InstructionContext.node, FSUtil.node, Global.node],
})
