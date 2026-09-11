// Misci server entrypoint for Termux/Android
// Starts the Misci/opencode HTTP server on localhost. The Android app's
// WebView connects to this automatically.
import { Server } from "./node.js"

const port = Number(process.env.PORT ?? "6299")
const hostname = process.env.HOSTNAME ?? "127.0.0.1"

const auth = process.env.OPENCODE_SERVER_PASSWORD
if (!auth) {
  console.log("Warning: OPENCODE_SERVER_PASSWORD is not set; server is unsecured.")
}

const listener = await Server.listen({ port, hostname })
console.log(`Misci server listening on ${listener.url}`)
