<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/159be5de-0535-4bb8-b727-689534ae1a61

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Debug / deployment notes

- Removed bundled `node_modules`; install dependencies with `npm install` before running.
- Fixed audio MIME-type propagation so WAV/WebM/MP3 uploads are stored with the correct content type.
- Increased the server JSON upload limit to 75 MB to accommodate the UI's audio upload workflow.
- Added safer API error handling when a server returns non-JSON errors.
- Made local acoustic fallback metrics deterministic instead of changing on every scan.
- Added cleanup for microphone timers/tracks and audio resources.
- Sanitized the included `.env`; **never commit real API keys or service-role credentials**. Use `.env.example` or your hosting provider's secret manager.
- TypeScript validation passes with the project's declared dependencies. A local Vite build in the supplied archive was blocked by a missing Rollup optional native package; deleting `node_modules` and running a fresh `npm install` resolves that packaging issue.
