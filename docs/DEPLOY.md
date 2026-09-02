# Deploy to Vercel (HTTPS)

WebMCP requires a secure context. Localhost works for development. Production
must be served over HTTPS.

## Steps

1. Install the Vercel CLI if needed: `pnpm dlx vercel`
2. From the project root: `pnpm dlx vercel`
3. Confirm the project uses this directory as the root.
4. Optional live extraction: set `OPENAI_API_KEY` in the Vercel project env.
5. After deploy, open the HTTPS URL and confirm:
   - the page loads
   - with `/?inspector=1`, the inspector lists registered tools
   - `find_official_portal` still returns only allowlisted HTTPS hosts

## Origin trial later

If Chrome requires an origin trial token for production WebMCP, add it through
Chrome Origin Trials and document the token in the deployment notes. Do not
disable origin isolation. Keep `Permissions-Policy: tools=(self)`.
