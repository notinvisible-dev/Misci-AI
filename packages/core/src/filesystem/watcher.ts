export * as Watcher from "./watcher"

// @ts-ignore
import { createWrapper } from "@parcel/watcher/wrapper"
import type ParcelWatcher from "@parcel/watcher"
import { makeLocationNode } from "../effect/app-node"
import { Cause, Context, Effect, Layer, Ref, Semaphore } from "effect"
import { FileSystemWatcher } from "@opencode-ai/schema/filesystem-watcher"
import path from "path"
import { Config } from "../config"
import { EventV2 } from "../event"
import { Flag } from "../flag/flag"
import { FSUtil } from "../fs-util"
import { Git } from "../git"
import { Location } from "../location"
import { lazy } from "../util/lazy"
import { Ignore } from "./ignore"
import { Protected } from "./protected"

declare const OPENCODE_LIBC: string | undefined

const SUBSCRIBE_TIMEOUT_MS = 10_000

export const Event = FileSystemWatcher.Event

const watcher = lazy((): typeof import("@parcel/watcher") | undefined => {
  try {
    const libc = typeof OPENCODE_LIBC === "undefined" ? undefined : OPENCODE_LIBC
    const binding = require(
      `@parcel/watcher-${process.platform}-${process.arch}${process.platform === "linux" ? `-${libc || "glibc"}` : ""}`,
    )
    return createWrapper(binding) as typeof import("@parcel/watcher")
  } catch {
    return
  }
})

function getBackend() {
  if (process.platform === "win32") return "windows"
  if (process.platform === "darwin") return "fs-events"
  if (process.platform === "linux") return "inotify"
}

function protecteds(dir: string) {
  return Protected.paths().filter((item) => {
    const relative = path.relative(dir, item)
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  })
}

export const hasNativeBinding = () => !!watcher()

export interface Interface {
  /** Acquires the recursive project-tree watch that requires a working session. */
  readonly acquire: Effect.Effect<void>
  /** Releases the recursive project-tree watch that requires a working session. */
  readonly release: Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/v2/FileWatcher") {}

const noop = () => Service.of({ acquire: Effect.void, release: Effect.void })

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    if (yield* Flag.OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER) return noop()

    const backend = getBackend()
    const location = yield* Location.Service
    if (!backend) {
      yield* Effect.logError("watcher backend not supported", {
        directory: location.directory,
        platform: process.platform,
      })
      return noop()
    }

    const w = watcher()
    if (!w) return noop()

    yield* Effect.logInfo("watcher backend", { directory: location.directory, platform: process.platform, backend })
    const events = yield* EventV2.Service
    const fs = yield* FSUtil.Service
    const git = yield* Git.Service
    const context = yield* Effect.context()
    const runFork = Effect.runForkWith(context)
    const subscriptions: ParcelWatcher.AsyncSubscription[] = []
    yield* Effect.addFinalizer(() =>
      Effect.promise(() => Promise.allSettled(subscriptions.map((subscription) => subscription.unsubscribe()))),
    )

    const callback: ParcelWatcher.SubscribeCallback = (_error, updates) => {
      for (const update of updates) {
        if (update.type === "create") runFork(events.publish(Event.Updated, { file: update.path, event: "add" }))
        if (update.type === "update") runFork(events.publish(Event.Updated, { file: update.path, event: "change" }))
        if (update.type === "delete") runFork(events.publish(Event.Updated, { file: update.path, event: "unlink" }))
      }
    }

    const subscribe = (directory: string, ignore: string[]) => {
      const pending = w.subscribe(directory, callback, { ignore, backend })
      return Effect.promise(() => pending).pipe(
        Effect.tap((subscription) => Effect.sync(() => subscriptions.push(subscription))),
        Effect.timeout(SUBSCRIBE_TIMEOUT_MS),
        Effect.catchCause((cause) => {
          pending.then((subscription) => subscription.unsubscribe()).catch(() => {})
          return Effect.logError("failed to subscribe", { directory, cause: Cause.pretty(cause) })
        }),
      )
    }

    const config = (yield* (yield* Config.Service).entries())
      .filter((entry): entry is Config.Document => entry.type === "document")
      .flatMap((item) => item.info.watcher?.ignore ?? [])
    const watchTree = !!location.vcs && (yield* Flag.OPENCODE_EXPERIMENTAL_FILEWATCHER)
    const treeIgnore = [...Ignore.PATTERNS, ...config, ...protecteds(location.directory)]
    // The recursive project-tree watch is the expensive one on large or busy
    // trees, so it stays suspended until a session actually starts working.
    const treeSubscription = yield* Ref.make<ParcelWatcher.AsyncSubscription | undefined>(undefined)
    const activeSessions = yield* Ref.make(0)
    const lock = yield* Semaphore.make(1)

    const activate = Effect.fnUntraced(function* () {
      if (!watchTree) return
      if ((yield* Ref.get(treeSubscription)) !== undefined) return
      const pending = w.subscribe(location.directory, callback, { ignore: treeIgnore, backend })
      const subscription = yield* Effect.promise(() => pending).pipe(
        Effect.timeout(SUBSCRIBE_TIMEOUT_MS),
        Effect.catchCause((cause) => {
          pending.then((subscription) => subscription.unsubscribe()).catch(() => {})
          return Effect.logError("failed to subscribe", {
            directory: location.directory,
            cause: Cause.pretty(cause),
          }).pipe(Effect.as(undefined))
        }),
      )
      if (subscription) yield* Ref.set(treeSubscription, subscription)
    })

    const deactivate = Effect.fnUntraced(function* () {
      const subscription = yield* Ref.getAndSet(treeSubscription, undefined)
      if (subscription) yield* Effect.promise(() => subscription.unsubscribe()).pipe(Effect.ignore)
    })

    yield* Effect.addFinalizer(() => deactivate().pipe(Effect.ignore))

    const setActive = Effect.fn("Watcher.setActive")(function* (active: boolean) {
      if (!watchTree) return
      yield* lock.withPermits(1)(
        Effect.gen(function* () {
          const next = yield* Ref.updateAndGet(activeSessions, (count) =>
            active ? count + 1 : Math.max(0, count - 1),
          )
          if (active && next === 1) return yield* activate()
          if (!active && next === 0) return yield* deactivate()
        }),
      )
    })

    if (location.vcs?.type === "git") {
      const resolved = (yield* git.repo.discover(location.directory))?.gitDirectory
      const vcs = resolved ? yield* fs.realPath(resolved).pipe(Effect.catch(() => Effect.succeed(resolved))) : undefined
      if (vcs && !config.includes(".git") && !config.includes(vcs) && (!resolved || !config.includes(resolved))) {
        const ignore = (yield* fs.readDirectoryEntries(vcs).pipe(Effect.catch(() => Effect.succeed([])))).flatMap(
          (entry) => (entry.name === "HEAD" ? [] : [entry.name]),
        )
        yield* Effect.forkScoped(subscribe(vcs, ignore))
      }
    }

    return Service.of({ acquire: setActive(true), release: setActive(false) })
  }).pipe(
    Effect.catchCause((cause) => {
      return Effect.logError("failed to init watcher service", { cause: Cause.pretty(cause) }).pipe(
        Effect.as(noop()),
      )
    }),
  ),
)

export const node = makeLocationNode({
  service: Service,
  layer,
  deps: [FSUtil.node, Location.node, Config.node, Git.node, EventV2.node],
})
