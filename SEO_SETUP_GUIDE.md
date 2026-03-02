# SEO Setup Guide — VTU Habba 2026 Portal
**URL:** `https://vtufest2026.acharyahabba.com/`  
**Last Updated:** March 2026

---

## 1. Google Search Console Setup

### Step 1 — Add Property
1. Go to [Google Search Console](https://search.google.com/search-console/) and sign in with an admin Google account.
2. Click **"Add property"** → select **"Domain"** property type.
3. Enter `vtufest2026.acharyahabba.com` as the domain.

### Step 2 — DNS Verification (Recommended)
Google will provide a `TXT` record. Add it via your DNS provider:

| Field | Value |
|---|---|
| Type | `TXT` |
| Name / Host | `vtufest2026` (subdomain) |
| Value | `google-site-verification=XXXXXXXXXXXXXXXXX` (provided by Google) |
| TTL | 3600 |

> **Note:** DNS propagation can take up to 48 hours, but usually resolves within 15 minutes for Cloudflare / Vercel DNS.

After adding, click **"Verify"** in Search Console.

### Step 3 — Submit Sitemap
1. In Search Console, go to **Sitemaps** (left sidebar).
2. Under **"Add a new sitemap"**, enter: `sitemap.xml`
3. Click **Submit**.
4. Status should show **"Success"** within a few minutes.
5. You'll see how many URLs were discovered (should be 3: `/`, `/register-student`, `/forgot-password`).

### Step 4 — URL Inspection
1. Click **"URL Inspection"** in the left sidebar.
2. Paste `https://vtufest2026.acharyahabba.com/` and press Enter.
3. If it shows **"URL is not on Google"**, proceed to Step 5.
4. If indexed, verify the rendered page looks correct.

### Step 5 — Request Indexing
1. After URL Inspection, click **"Request Indexing"**.
2. Google will queue a crawl — typically within 1–7 days.
3. Repeat for `/register-student`.

---

## 2. Bing Webmaster Tools Setup

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/) and sign in.
2. Click **Add a Site** → enter `https://vtufest2026.acharyahabba.com`
3. Choose **Auto-detect** (Bing can import from Google Search Console — recommended).
4. Or choose **XML file** → submit the sitemap URL:  
   `https://vtufest2026.acharyahabba.com/sitemap.xml`
5. Under **Sitemaps**, submit: `https://vtufest2026.acharyahabba.com/sitemap.xml`

---

## 3. Testing Structured Data

### Google Rich Results Test
1. Go to [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
2. Enter: `https://vtufest2026.acharyahabba.com/`
3. Click **Test URL**
4. Expected results: **Event** schema detected ✓
5. Check for any warnings or errors in the schema output.

### Schema.org Validator
1. Go to [https://validator.schema.org/](https://validator.schema.org/)
2. Paste the URL or paste the JSON-LD content from `index.html`
3. Should show 0 errors for all three schemas (Event, Organization, WebSite)

### Google Structured Data Markup Helper (alternative)
- [https://www.google.com/webmasters/markup-helper/](https://www.google.com/webmasters/markup-helper/)

---

## 4. Checking Indexing Status

### Using site: operator
Open Google and search:
```
site:vtufest2026.acharyahabba.com
```
- **No results** = Not yet indexed (normal for new domains, wait 1–2 weeks)
- **Results shown** = Successfully indexed ✓
- If you see protected routes (dashboards) appearing, check your robots.txt is deployed correctly.

### Using Google Search Console
- **Coverage** report → **Valid** tab → shows all indexed URLs
- **Excluded** tab → check that protected routes appear under "Blocked by robots.txt"

---

## 5. Post-Deployment Checklist

Run these checks after every deployment:

| # | Check | Tool | Expected |
|---|---|---|---|
| 1 | `robots.txt` accessible | Browser → `https://vtufest2026.acharyahabba.com/robots.txt` | File loads correctly |
| 2 | `sitemap.xml` accessible | Browser → `https://vtufest2026.acharyahabba.com/sitemap.xml` | Valid XML with 3 URLs |
| 3 | Canonical tag present | View source → check `<link rel="canonical">` | Points to root URL |
| 4 | OG tags | [Facebook Debugger](https://developers.facebook.com/tools/debug/) | Title, description, image shown |
| 5 | Twitter Card | [Twitter Card Validator](https://cards-dev.twitter.com/validator) | Summary large image |
| 6 | Structured data | [Rich Results Test](https://search.google.com/test/rich-results) | Event schema detected |
| 7 | Security headers | [securityheaders.com](https://securityheaders.com/?q=vtufest2026.acharyahabba.com) | Grade A or B |
| 8 | LCP performance | Chrome DevTools → Lighthouse → Performance | LCP < 2.5s |
| 9 | Single `<h1>` | DevTools console → `document.querySelectorAll('h1').length` | Returns `1` |
| 10 | No console errors | Browser DevTools → Console | No red errors |

---

## 6. Timeline Expectations

| Timeline | Expected Activity |
|---|---|
| Day 1–3 | Googlebot crawls `robots.txt` and `sitemap.xml` |
| Day 3–7 | Homepage and `/register-student` get indexed |
| Week 2–3 | Pages appear in `site:` operator results |
| Week 3–4 | Structured data (Event schema) may appear in rich results |
| Month 2+ | Stable ranking signals. Monitor via GSC Performance tab |

> **Important:** Login/registration portals rarely rank for competitive keywords. The primary SEO benefit here is ensuring students can **find the portal via direct searches** like *"VTU Habba 2026 register"* or *"VTU Habba 2026 login"*.

---

## 7. Common Mistakes to Avoid

### ❌ Don't noindex the entire portal
Setting `<meta name="robots" content="noindex">` in `index.html` will prevent students from finding the registration page via Google. The current setup correctly allows public pages while using robots.txt to block protected routes.

### ❌ Don't submit protected dashboard routes in the sitemap
Only public, unauthenticated routes belong in `sitemap.xml`. Dashboard pages behind login serve no crawlable content.

### ❌ Don't skip the canonical tag
Without `<link rel="canonical">`, the SPA's client-side routes (e.g. `/?q=...` variants) can create duplicate URL signals. The canonical pointing to `/` resolves this.

### ❌ Don't lazy-load the hero image (`main.webp`)
The VTU/Acharya logo image is the Largest Contentful Paint (LCP) element. Lazy-loading it delays rendering. The current setup uses `loading="eager"` and `fetchpriority="high"` plus a `<link rel="preload">` in `<head>`.

### ❌ Don't forget to resubmit the sitemap after major route changes
If new public routes are added (e.g., an event schedule page), update `sitemap.xml` and re-submit in Search Console.

### ❌ Don't let the Vercel Cache-Control header conflict with SEO
The current `no-cache, no-store` policy on HTML is correct — it ensures crawlers always get the freshest `index.html`. Static assets (favicons, images) have long-lived cache.

---

## 8. Useful Links

| Resource | Link |
|---|---|
| Google Search Console | https://search.google.com/search-console/ |
| Bing Webmaster Tools | https://www.bing.com/webmasters/ |
| Rich Results Test | https://search.google.com/test/rich-results |
| Schema Validator | https://validator.schema.org/ |
| Facebook OG Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | https://cards-dev.twitter.com/validator |
| Security Headers Checker | https://securityheaders.com/ |
| PageSpeed Insights | https://pagespeed.web.dev/ |
| Sitemap Protocol Docs | https://www.sitemaps.org/protocol.html |
