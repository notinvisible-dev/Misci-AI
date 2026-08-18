---
name: youtube-subtitles
description: Use this skill whenever the user gives a YouTube URL or video ID and wants the video's content understood, summarized, or analyzed via its subtitles/captions — without downloading the actual video/audio. Triggers on phrases like "what does this video say", "summarize this YouTube video", "get the transcript of", or a bare youtube.com/watch?v= or youtu.be/ link. Fetches subtitles as text, reads them into context, then deletes the temp file. Do NOT use for downloading video/audio content itself.
---

# YouTube Subtitles: Fetch, Read, Delete

## Purpose
Get the spoken content of a YouTube video as plain text, use it to answer the
user's question or produce a summary, then clean up — leaving no subtitle
files sitting around afterward. The video is never downloaded, only its
caption track.

## Prerequisites
- `yt-dlp` installed and on PATH (`pip install -U yt-dlp --break-system-packages`
  or in a venv).
- A working internet connection with no domain allowlist blocking
  `youtube.com` (this fails in sandboxed environments with restricted
  egress — check that first if step 1 errors out).
- Optional but recommended: a JS runtime (e.g. `deno`) installed, since
  yt-dlp warns about degraded extraction without one. Subtitles still work
  without it in most cases.

## Steps

1. **Extract the video ID** from whatever the user gave you (full URL,
   shortened youtu.be link, or bare ID). Normalize to just the ID.

2. **Fetch subtitles to a temp location**, don't skip `--skip-download` or
   you'll pull the whole video:
   ```bash
   cd /tmp
   yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download \
     --output "%(id)s" "https://www.youtube.com/watch?v=VIDEO_ID"
   ```
   - `--write-sub` grabs manual/uploaded captions if they exist (usually
     cleaner than auto-generated).
   - `--write-auto-sub` falls back to auto-generated captions.
   - This produces a `.vtt` file like `/tmp/VIDEO_ID.en.vtt`.
   - If no captions exist in any language, yt-dlp will report this — stop
     here and tell the user the video has no captions (don't attempt
     speech-to-text unless that's a separate, explicit skill).

3. **Read the file** and strip it down to clean text:
   - VTT files contain timestamp blocks and cue formatting — strip those,
     keep just the spoken lines, and de-duplicate repeated lines (common in
     auto-generated captions where each line overlaps the next).
   - Load the resulting text into context to work with (summarize, answer
     questions, extract quotes, etc.) per whatever the user actually asked.

4. **Delete the temp file(s)** immediately after reading, regardless of
   success or failure of subsequent steps:
   ```bash
   rm -f /tmp/VIDEO_ID*.vtt
   ```
   Do this even if the video has multiple subtitle files (e.g. multiple
   languages were pulled by mistake) — clean up everything matching that
   video ID.

5. **Never persist or forward the raw subtitle file** as a deliverable to
   the user unless they explicitly ask for the transcript file itself. The
   default behavior is: fetch → read → answer → delete. The file is scratch
   space, not output.

## Notes on caption quality
- Auto-generated captions have no punctuation and can misspell names/terms —
  useful for gist, not for verbatim quotes.
- Manually uploaded captions (when available) are far more reliable; always
  prefer `--write-sub` output over `--write-auto-sub` if both exist.
- Some videos disable captions entirely or restrict them by region — treat
  a fetch failure as "no captions available," not an error to retry
  aggressively.

## Example invocation pattern
```bash
VIDEO_ID="V4zb8QhQY58"
cd /tmp
yt-dlp --write-sub --write-auto-sub --sub-lang en --skip-download \
  --output "%(id)s" "https://www.youtube.com/watch?v=${VIDEO_ID}"
cat /tmp/${VIDEO_ID}*.vtt
rm -f /tmp/${VIDEO_ID}*.vtt
```
