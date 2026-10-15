# NEXA — Public Engineering Case Study

Independent React/TypeScript/Vite/Tailwind project for Yasmeen Azmat Ali's portfolio. This does not edit or invoke the private assistant or any n8n workflows.

## Start locally

```bash
npm install
npm run dev
```

Open the Local URL printed by Vite. To verify and build:

```bash
npx tsc --noEmit
npm run build
```

## Publish

Upload only dist/ to Netlify Drop (https://app.netlify.com/drop). For Git hosting, use a NEW repository and deployment: build command npm run build, publish directory dist. Do not merge this source into the private assistant repository.

After obtaining the actual public site URL, configure SEO metadata and rebuild:

```bash
npm run set-site-url -- https://YOUR-ACTUAL-PUBLIC-HOSTNAME
npm run build
```

Replace the example hostname with your final URL. This writes canonical/Open Graph URL/image metadata, sitemap.xml and the robots sitemap reference. Until then the site has title, description, Open Graph title/description/type and an indexable robots.txt, but no invented canonical URL or sitemap.

## Portfolio entry

Title: NEXA — Personal AI Operations Assistant | Agentic AI & Workflow Orchestration

Link the deployed public showcase under Featured Projects on https://yasmeenazmat.com. Suggested description: A personal AI operations assistant project with a responsive conversational frontend, four visual avatar states, a separate n8n workflow foundation and a planned secure private integration. Explore the engineering case study and fictional sample demo.

## Scope and assets

- Original hijab-wearing character reused. No replacement character or generated mockup.
- Reference-derived portrait crop is small and may look soft on large screens. The original high-resolution nexa-main.png is retained for identity/social imagery.
- Actual Chromium screenshots of the existing prototype are used in the gallery. They show sample content and the public professional display name; there is no inbox/calendar/account data.
- No video link was supplied, so no nonfunctional Watch Demo button is present.
- Demo chat is deterministic local sample data. State selectors are visual cues only; no microphone recording, speech recognition, audio playback or lip-sync.
- No external font/CDN requests, analytics, credentials, private exports, n8n URLs, API calls or login fields.
- Portfolio, GitHub and LinkedIn links use supplied public URLs. Contact leads to LinkedIn; no invented email address or portfolio contact route.
- Reported historical recovery/specialist verification is attributed to the owner; this site does not reverify the live workflows or claim deployed security.

## Components and content

src/App.tsx: reusable Section, Tag, Portrait and ScreenshotGallery components; interactive public demo, architecture layer selector, mobile navigation and native FAQ accordions.
src/styles.css: design system, portrait masks, responsive grids and reduced-motion support.
scripts/set-site-url.mjs: deployment metadata configuration.

Sections cover navigation, cinematic hero, problem, solution, capabilities, interface gallery, demo, four states, architecture, request lifecycle, privacy, engineering case study, stack, development journey, roadmap, public/private comparison, builder, FAQ and final CTA/footer.

## Verification limits

TypeScript validation and Vite production build were run successfully for this new site. Static checks validated referenced public assets and prohibited private-API patterns. Browser/responsive/accessibility interaction testing of this NEW case-study site was not run: the supported managed browser capability is unavailable. Prior assistant screenshots are actual earlier browser results, not evidence that this new site has been browser-tested.

Hosted publication was not completed because the Sites publishing helper is unavailable in this environment. This source ZIP and dist/ are ready for manual deployment. Complete browser/device review before treating it as production-verified.

## Portfolio refinement (13 October 2026)

Updated in place; original character, layout structure and useful interactions retained.
- Editorial hero now names NEXA — Personal AI Operations Assistant with the requested supporting line and demo/architecture/GitHub actions.
- Eight capability cards include restricted memory and future approval/action scope. No private memory or write workflows are enabled.
- Simulated response lifecycle: thinking → speaking → idle; reset cancels timers; local chat auto-scrolls with reduced-motion support.
- Six clickable architecture nodes describe interface, request handling, orchestration, specialists, services and response. The public data path remains isolated.
- Timeline retains six requested milestones. Added recruiter-facing skills, engineering decision details and reproducible validation evidence.
- Screenshot lightboxes include actual prior login, desktop/mobile prototype, supplied visual-state and earlier architecture views. These are not screenshots of the updated release.
- Responsive grid refinements, explicit avatar aspect ratio, reduced-motion-aware scroll and improved mobile navigation.
- Social preview uses the supplied actual public hero screenshot. Set the final public site URL with npm run set-site-url -- https://YOUR-ACTUAL-HOSTNAME, then rebuild for absolute Open Graph image/canonical URLs and sitemap.
- Source backup is included under backups/. Do not publish that folder separately; deploy only dist/.

### Missing verified links / recording

src/config/publicLinks.ts contains verified portfolio, GitHub profile and LinkedIn URLs. The exact NEXA repository URL and booking URL have not been supplied. Set repository and booking to those real public URLs to enable accurate CTAs. Until then GitHub opens the developer profile, and the booking button is omitted.

The screen recording mentioned by the owner was not available in the current scratch attachments. Supplied screenshots and existing source were used as the visual baseline. Video rendering is supported: place the actual sanitized MP4 under public/media/ and set demoVideo in src/config/publicLinks.ts. No placeholder video or fabricated recording is included.

### Updated checks

Passed npx tsc --noEmit and npm run build. A static React server render checked unique section IDs, valid local anchor targets, existing image files and image descriptions. Static source inspection found no fetch/XMLHttpRequest API calls. This is not a complete security audit.

Lint could not run because this project has no lint script/configuration. Updated browser interactions, responsive overflow, actual device compatibility and accessibility were not browser-tested because the supported managed browser capability is unavailable. Responsive CSS was inspected, but that does not establish a browser pass. Hosted publishing remains unavailable because the Sites publishing helper is not installed. Manual deployment instructions above remain applicable.
