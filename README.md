# NEXA — Public AI Engineering Case Study

Public website: https://nexa-public.netlify.app  
Source: https://github.com/yasmeenmh90-beep/nexa-public

A React/TypeScript/Vite/Tailwind showcase by Yasmeen Azmat Ali. This public application is separate from the private NEXA assistant and its n8n workflows.

## What works

- **Sample Demo:** six fictional local task summaries; no OpenAI request.
- **Live AI:** questions sent through a Netlify Function to the OpenAI Responses API, with up to three recent completed exchanges for follow-ups (at most 6000 characters of history). Reset, mode changes or refreshing clears this browser-held context.
- **Voice:** supported browsers can transcribe microphone input and read replies aloud. Review dictated text, then press Send.
- **Speaking feedback:** a glowing halo, animated bars and subtle portrait movement. Precise lip sync is deferred; the experimental mouth deformation has been removed.
- Suggested Live AI questions populate the composer for review before Send.
- Copy answer buttons with success/failure feedback.
- Report a problem / Suggest a feature links open prefilled public GitHub issue drafts; submitting requires a GitHub account. No conversation is automatically attached.
- Responsive navigation, architecture cards, FAQ and screenshot lightboxes.

Neither mode accesses email, calendars, private repositories, personal memory or n8n. Live answers may be inaccurate. Voice availability and voices depend on the browser; recognition may use its provider’s speech service.

## Local development

Use Node.js 22 and a clean dependency installation:

```bash
npm ci
npm run dev
npm run typecheck
npm run build
node --test tests/chat.test.mjs
```

Vite alone serves the frontend and Sample Demo. The /api/chat endpoint runs as a Netlify Function; use the deployed site or a properly configured Netlify development environment for Live AI.

## Deployment

This repository is connected to Netlify. A commit to the production branch triggers a build using netlify.toml:

- Build: npm run build
- Publish: dist
- Functions: netlify/functions

Batch related edits into one commit to avoid unnecessary production builds. Do not deploy source folders or node_modules with Netlify Drop; a frontend-only dist upload does not set up the server function.

Set these environment variables in Netlify, never in browser code or public files:

| Name | Purpose |
| --- | --- |
| OPENAI_API_KEY | Server-side OpenAI project API key |
| NEXA_LIVE_CHAT_ENABLED | Set to true to enable Live AI; any other value disables it |

Environment changes must reach the deployed function. Do not paste keys into issues, screenshots or the repository.

## Request controls and costs

The function currently accepts POST JSON requests from the configured public origin, validates a 1–1500 character message, limits the request body to 48000 bytes, uses a 20-second upstream timeout, and requests at most 400 output tokens from gpt-4.1-mini. Its Netlify rate-limit configuration is 5 requests per 60 seconds for each IP/domain grouping.

History is limited to six alternating user/assistant messages, at most 2000 characters each and 6000 characters total; system/developer roles are rejected. Only completed Live AI exchanges are retained for follow-ups. No chat is persisted to browser storage or an application database.

Follow-up context increases input-token use compared with isolated questions. Origin checks are not authentication. Per-IP throttling is not a global spending cap. Check the actual Netlify and OpenAI account usage controls separately; this repository cannot verify account budgets or guarantee a maximum bill. Netlify deployment usage and OpenAI API usage are separate.

To disable Live AI, set NEXA_LIVE_CHAT_ENABLED to false and deploy that change. Sample Demo remains available.

## Metadata and links

Canonical URL, Open Graph image URL, robots.txt and sitemap.xml target https://nexa-public.netlify.app.

If the hostname changes:

```bash
npm run set-site-url -- https://YOUR-FINAL-PUBLIC-HOSTNAME
npm run build
```

Update the permitted request origin in netlify/functions/chat.mjs as well.

Public links live in src/config/publicLinks.ts. A booking link and video are optional. Only add a sanitized recording containing public demonstration content.

## Project structure

- src/App.tsx — page content, architecture, portrait and gallery.
- src/components/VoiceChat.tsx — sample/live chat, voice controls and request cancellation.
- src/hooks/useVoice.ts — browser speech recognition and synthesis lifecycle.
- src/styles.css — layout, speaking effects, mobile and reduced-motion styles.
- netlify/functions/chat.mjs — server-side OpenAI request handling.
- scripts/set-site-url.mjs — deployment metadata configuration.

## Validation and remaining work

The owner reports successful microphone transcription, Live AI answers and spoken-reply tests on the deployed site. TypeScript checks and seven Node backend tests passed for the visitor tools update. Backend tests mock OpenAI; they do not verify live model output, clipboard permissions or browser interactions. Earlier Netlify releases built and deployed; a new production build is validated by the next Netlify deployment.

The screenshot gallery documents an earlier dashboard prototype, not every feature of the current release. Historical source-recovery and n8n verification claims are attributed to the owner.

Remaining: complete current mobile/tablet and accessibility review; verify account spending controls; review dependencies; record a clean walkthrough. Private authentication, personal-service integration and precise lip sync remain separate future work. No complete security audit is claimed.


## Final visual refinement

The public page now puts the conversation first: an editorial hero, three use cases, a compact chat studio, separate connected Sample and Live AI paths, and shorter engineering/privacy sections. Earlier prototype screenshots remain available in a collapsible gallery with working lightboxes.

Voice settings are grouped into an expandable panel. Microphone, spoken-reply toggle and Read aloud/Stop speaking remain directly available. Suggested questions become short follow-up prompts after the conversation starts. The existing avatar, speech lifecycle, copy controls, feedback links and bounded context are retained.

Validation for this update: TypeScript compilation, a Vite production bundle, seven mocked backend tests, and static rendered-HTML checks. Browser preview was unavailable in the editing environment; real mobile, clipboard, microphone and accessibility interactions still need device review. No new dependencies or API integrations were added.
