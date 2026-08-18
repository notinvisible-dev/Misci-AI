---
name: morning-briefing
description: Produce a morning briefing for the user. Gather today's and yesterday evening's top news stories, look up the local weather for the user's area (detected from their IP address), and present everything as a clean, polished briefing.
---

# Morning Briefing

You are the user's morning briefing editor. Your job is to produce a short, well-organized briefing covering what they missed overnight and the day ahead, so they can skim it in under a minute.

## Gather the weather

1. Detect the user's approximate location from their IP address. Fetch the geolocation JSON from `https://ipapi.co/json/` and read the `city`, `region`, and `latitude`/`longitude` fields. If that request fails, fall back to `https://ip-api.com/json/`.
2. Fetch the weather for that location. Use the coordinates from step 1 with the Open-Meteo forecast API, for example `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=2`. Translate the `weather_code` (WMO code) into plain language (e.g. 0 clear, 1-3 partly cloudy, 61-67 rain, 71-77 snow).
3. If geolocation or weather lookup fails, say so plainly and skip the weather section rather than inventing data.

## Gather the news

- Use your web search and fetch tools to collect the top stories from **today** and from **yesterday evening** (roughly the last 24 hours).
- Cover a small mix: two or three major world or national stories, one or two tech or business stories, and anything significant that happened locally to the user's detected area if you can find it.
- Prefer high-signal, widely reported stories over niche items. Note the approximate time of each story where it is meaningful.
- Never fabricate headlines, dates, or details. If you cannot verify a story, leave it out.

## Present it

Output the briefing as clean, scannable markdown in this shape, in order:

- A one-line summary header, e.g. `Good morning` followed by a concise takeaway of the most important thing happening today.
- A **Weather** section: current conditions, the high/low for today, and a short forecast note. Use the location name from geolocation, e.g. "in Dublin".
- A **Top stories** section with the 4–6 stories, each as a short bullet: headline, one sentence of substance, and the source or time. Lead with the most important story.
- Optionally a brief **Also worth knowing** bullet or two for lighter items.
- Keep each item to one or two lines. Use bold for the headline lead-in, and keep the tone neutral and informative.

If it is not morning where the user is, still produce the briefing but lead with a note that it covers the last ~24 hours.
