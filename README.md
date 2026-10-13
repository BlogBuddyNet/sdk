# @blogbuddy/sdk

Render a [BlogBuddy](https://blogbuddy.net) blog on your own site.

Your posts are published on **your** domain, not ours, so the SEO value is yours - which
also means the canonical tags, link previews and sitemap have to be served from your
site. This package generates them; you serve them.

```bash
npm install @blogbuddy/sdk
```

## The whole blog

One config object, passed to everything.

```ts
// lib/blogbuddy.ts
import type { BlogBuddyConfig } from '@blogbuddy/sdk/server'

export const blog: BlogBuddyConfig = {
  blog: 'your-blog-slug',
  apiKey: process.env.BLOGBUDDY_API_KEY!,
  siteUrl: 'https://acme.com',
  postUrlTemplate: '/blog/{slug}',
}
```

Everything else is one line each. The SEO fields above are only fallbacks - whatever you
fill in under **Blog settings → SEO** wins over them.

### A post page

```tsx
// app/blog/[slug]/page.tsx
import { BlogBuddyPost, blogBuddyMetadata, blogBuddyStaticParams } from '@blogbuddy/sdk/server'
import { blog } from '@/lib/blogbuddy'

export const generateMetadata = blogBuddyMetadata(blog)
export const generateStaticParams = blogBuddyStaticParams(blog)

export default async function Page({ params }) {
  return <BlogBuddyPost {...blog} slug={(await params).slug} />
}
```

That is canonical tags, Open Graph, Twitter cards, `BlogPosting` and `BreadcrumbList`
structured data, and a prerendered page per post. The component emits its own JSON-LD -
it already fetched the post and the config, so making you wire that up was asking you to
repeat work it had already done.

The page is still yours. Put your own header, footer or sidebar around the component:

```tsx
export default async function Page({ params }) {
  return (
    <MyLayout>
      <BlogBuddyPost {...blog} slug={(await params).slug} breadcrumbHome="Acme" />
    </MyLayout>
  )
}
```

### An index page

```tsx
// app/blog/page.tsx
import { BlogBuddyList, blogBuddyMetadata } from '@blogbuddy/sdk/server'
import { blog } from '@/lib/blogbuddy'

export const generateMetadata = blogBuddyMetadata(blog, { title: 'Blog' })

export default async function Page({ searchParams }) {
  return <BlogBuddyList {...blog} perPage={10} page={Number((await searchParams).page) || 1} />
}
```

Add `pageUrlTemplate: '/blog?page={page}'` to the config and page 2 gets its own
canonical instead of claiming to be page 1.

### Sitemap and feeds

```ts
// app/sitemap.ts
export default blogBuddySitemap(blog)

// app/blog/feed.xml/route.ts
export const GET = blogBuddyFeed(blog)

// app/blog/atom.xml/route.ts
export const GET = blogBuddyFeed(blog, { format: 'atom' })
```

`blogBuddySitemap` takes `extra` for the rest of your site's pages - it owns the blog's
URLs, not your whole site's.

A feed has to name its own address, and the default assumes the paths above. Mounting one
somewhere else takes a path, resolved against your site URL, so the origin is never
written twice: `blogBuddyFeed(blog, { feedUrl: '/feed.xml' })`.

If your index does not sit at the parent path of your posts - a list at `/` with posts at
`/posts/{slug}`, say - set `pageUrlTemplate` on your config (`'/?page={page}'`). It is what
the index's own canonical tag is built from.

## Vite, Create React App, and other single-page apps

`BlogBuddyPost` and `BlogBuddyList` are React Server Components. They will not run in a
build that has no server - and because nothing in this package imports from `next`, a
Vite or CRA build resolves them, bundles them and reports success before failing at
runtime. That used to leave a blank page; it now throws an error naming this section.

Use `BlogBuddy.Post` and `BlogBuddy.List` instead. They render the design you built under **Design** in the
dashboard, in the browser, and it is the only thing in this package that will:

```tsx
import { BlogBuddy } from '@blogbuddy/sdk/renderer'

// Your list page
<BlogBuddy.List blog="your-blog-slug" apiKey={KEY} perPage={10} />

// One post
<BlogBuddy.Post blog="your-blog-slug" apiKey={KEY} slug={slug} />
```

That is the whole integration. It fetches the posts and the design, declares your custom
fonts, applies your per-block and hover CSS, and wires the pagination block up to page in
place - the same output the server components produce, drawn by the browser instead.

| Prop | |
| --- | --- |
| `blog`, `apiKey` | required; `baseUrl` only when self-hosting |
| `slug` | render one post. Omit for the list page |
| `perPage` | page size. The design's pagination block decides numbered pages vs. "Load more" |
| `postUrlTemplate` | e.g. `/blog/{slug}` - whatever your router expects |
| `fallback` | shown while loading |

### Next.js vs. Vite/CRA, feature by feature

✅ works · ⚠️ partly - read the note · ❌ not possible

| | Next.js App Router | Vite / Create React App |
| --- | --- | --- |
| **Your blog** | | |
| The design from the **Design** tab | ✅ | ✅ |
| Custom fonts, hover styles, per-block CSS | ✅ | ✅ |
| All 13 constructor block types | ✅ | ✅ |
| Table of contents, related posts, carousel | ✅ | ✅ |
| Pagination / Load more | ✅ each page has a real URL (`?page=2`) | ✅ buttons that swap in place, no URL per page |
| What you write | `<BlogBuddyPost>` + 2 route helpers | `<BlogBuddy.Post>` |
| **Being found** | | |
| The post's text in the HTML your host returns | ✅ | ❌ an empty shell, filled in later by JS |
| Google indexes the post | ✅ straight away | ⚠️ only once it comes back to run the JS |
| Slack / X / Facebook / LinkedIn / iMessage preview card | ✅ | ❌ never - none of them run JS |
| Per-post `<title>` and description | ✅ | ⚠️ set in the browser (React 19; `react-helmet-async` on React 18 and CRA) |
| Canonical tag | ✅ | ⚠️ same as above |
| Open Graph / Twitter tags | ✅ | ⚠️ they do reach the page, but no unfurler gets that far |
| JSON-LD (BlogPosting, Breadcrumb, Blog) | ✅ automatic | ⚠️ client-side, and lands in `<body>` |
| `sitemap.xml` | ✅ one line | ✅ prebuild script |
| RSS and Atom feeds | ✅ one line each | ✅ prebuild script |
| A share image generated per post | ✅ | ❌ point `og:image` at the cover image instead |
| A real HTML file per post (SSG / ISR) | ✅ | ❌ |
| **Keys** | | |
| API key stays off the visitor's machine | ✅ server-side only | ❌ ships in the bundle - scope it read-only to one blog |

**How to read this.** Everything under *Your blog* is identical - the design renders the
same either way. Every ❌ and ⚠️ comes from one difference: whether HTML exists before the
visitor's browser starts working. The rows you cannot buy back at any price are the
preview card and the post text being in the response, because the programs that need them
run no JavaScript at all. The rest of the SEO rows are either fine (sitemap, feeds) or
good enough for Google specifically.

### SEO from a single-page app

Most of it is reachable; one part is not. Taking them in order of how much they cost you:

**A sitemap and feeds are free, and just as good as the server-rendered ones.** The root
entry is framework-free and runs in Node, so a prebuild script writes real static files
that crawlers fetch without executing anything:

```js
// scripts/generate-seo.mjs - run it before `vite build`
import { writeFileSync } from 'node:fs'
import { buildSitemapEntries, buildRssFeed } from '@blogbuddy/sdk'

const config = { siteUrl: 'https://acme.com', postUrlTemplate: '/blog/{slug}', siteName: 'Acme' }
const { data: posts } = await fetch(`https://api.blogbuddy.net/api/v1/posts?blog=your-blog-slug`, {
  headers: { Authorization: `Bearer ${process.env.BLOGBUDDY_API_KEY}` },
}).then((r) => r.json())

writeFileSync('public/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  buildSitemapEntries(posts, config)
    .map((e) => `  <url><loc>${e.url}</loc><lastmod>${new Date(e.lastModified).toISOString()}</lastmod></url>`)
    .join('\n') + '\n</urlset>\n')

writeFileSync('public/feed.xml', buildRssFeed(posts, config, { feedUrl: 'https://acme.com/feed.xml' }).body)
```

Use a separate build-time key here, not the one in your bundle - this runs on your
machine or in CI, and a key you can revoke without breaking your build is worth having.

**Meta tags mostly work.** React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>`
from anywhere in the tree, client renders included, so per-post titles, descriptions and
canonical tags do end up where a crawler looks. Google runs JavaScript and will see them.
On React 18 or Create React App you need `react-helmet-async` to do the same job.

**Link previews do not work, and cannot be made to.** Slack, X, Facebook, LinkedIn and
iMessage run no JavaScript at all. They read the HTML your server returned, which for a
single-page app is the same empty shell for every route - so every link you share unfurls
identically, or not at all. No amount of client-side tagging changes this: it needs HTML
that exists before the request finishes.

If that matters, prerender at build time. Note which kind, because it decides whether the
design survives: a **browser-snapshot** prerenderer loads each route in a real browser and
saves the settled DOM, which captures `BlogBuddy.Post`; an **SSR-style** one
(`vite-react-ssg` and friends) renders in Node, where `useEffect` never runs, so you get
the empty shell. Or use the server components and a framework that renders on the server.

`BlogBuddy.Post` is a comfortable choice for a blog behind a login, embedded in a
dashboard, or inside an internal tool. For a public blog whose links get shared, weigh
the above.

Your API key ends up in the browser bundle here, which the server components avoid. Scope
the key to this one blog with read-only permission when you create it, so the worst a
lifted key can do is read posts that are already public.

## Data hook

If you want the posts but not the design - your own markup, your own layout:

```tsx
import { useBlogBuddy } from '@blogbuddy/sdk/hooks'

const { data: posts, loading, error } = useBlogBuddy({ blog: 'your-blog-slug', apiKey })
```

## Building it yourself

Everything above is a thin wrapper over these. Reach for them when you need something
the one-liners do not do.

### Feeds

`buildRssFeed` and `buildAtomFeed` return a string and a content type, so any framework
serves them the same way.

```ts
// app/blog/feed.xml/route.ts
import { getPosts } from '@blogbuddy/sdk/server'
import { buildRssFeed } from '@blogbuddy/sdk/feed'

export const revalidate = 300

export async function GET() {
  const [posts, config] = await Promise.all([getPosts(options), seoConfig(options, fallback)])
  const feed = buildRssFeed(posts, config, { feedUrl: `${config.siteUrl}/blog/feed.xml` })
  return new Response(feed.body, { headers: { 'Content-Type': feed.contentType } })
}
```

`buildAtomFeed` is identical. Pass `fullContent: true` to include each post's HTML -
off by default, because a full-text feed is a real trade (better for readers, worse for
your traffic) and it multiplies the document size.

Make them discoverable from every page of the blog:

```ts
import { feedLinkTags } from '@blogbuddy/sdk/feed'

alternates: {
  canonical: ...,
  types: feedLinkTags({ rss: '/blog/feed.xml', atom: '/blog/atom.xml' }),
}
```

### Structured data

`ArticleJsonLd` covers a post. Two more are worth emitting:

```tsx
import { JsonLd } from '@blogbuddy/sdk/json-ld'
import { buildBreadcrumbJsonLd, buildBlogJsonLd } from '@blogbuddy/sdk/seo'

// On a post - this is what puts "acme.com › Blog › Post title" under a search result
// instead of a raw URL.
<JsonLd data={buildBreadcrumbJsonLd(post, config, { home: 'Acme' })} />

// On the index - describes the page as a Blog carrying these posts.
<JsonLd data={buildBlogJsonLd(posts, { ...config, title: 'Blog', page })} />
```

### Paginated indexes

Pass `page` and set `pageUrlTemplate`, or every page of your index canonicalises to
page one - which tells a search engine that pages 2+ are duplicates and removes the only
discovery path to the posts on them.

```ts
const config = { ...seo, pageUrlTemplate: '/blog?page={page}' }

export async function generateMetadata({ searchParams }) {
  const { page } = await searchParams
  return buildBlogMetadata({ ...config, title: 'Blog', page: Number(page) || 1 })
}
```

Page 1 is always the bare index, never `?page=1` - the two would otherwise be separate
URLs serving identical content.

`perPage` is what turns pagination on, everywhere it appears. `getPosts`, `useBlogBuddy`
and `<BlogBuddyList>` all return every post when it is absent, and `page` on its own is
ignored rather than treated as an error. If a list is showing all your posts when you
expected ten, that is almost always a missing `perPage`.

### Image URLs

`defaultImage`, `postImageUrlTemplate` and a post's own cover image can each be a full
URL or a path. Paths are resolved against `siteUrl`, because a relative `og:image` is one
no crawler can fetch. A full URL, or a protocol-relative one starting `//`, is left as it
is, so pointing at a CDN works without further configuration.

### Per-post share images

Without this, every post that has no cover image shares one site-wide card, so the
preview says what the site is rather than what the post is. Point the SDK at a route on
your own site that generates one:

```ts
const config = { ...seo, postImageUrlTemplate: '/blog/{slug}/opengraph-image' }
```

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getPost } from '@blogbuddy/sdk/server'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  const { slug } = await params
  const { title } = await getPost({ ...options, slug })
  return new ImageResponse(<div style={{ /* ... */ }}>{title}</div>, size)
}
```

The order is: the post's own cover, then this, then `defaultImage`.

## Entry points

| Import | Contains | Runs on |
| --- | --- | --- |
| `@blogbuddy/sdk` | SEO helpers, post utilities, template types | anywhere, no React |
| `@blogbuddy/sdk/server` | `BlogBuddyPost`, `BlogBuddyList`, and the `blogBuddy*` route helpers | server |
| `@blogbuddy/sdk/renderer` | `BlogBuddy.Post` / `BlogBuddy.List` - the design, rendered in the browser | client |
| `@blogbuddy/sdk/seo` | `buildPostMetadata`, `buildSitemapEntries`, … | anywhere |
| `@blogbuddy/sdk/json-ld` | `ArticleJsonLd`, `JsonLd` | server |
| `@blogbuddy/sdk/feed` | `buildRssFeed`, `buildAtomFeed`, `feedLinkTags` | anywhere |
| `@blogbuddy/sdk/hooks` | `useBlogBuddy`, `useBlogBuddyPost` | client |
| `@blogbuddy/sdk/view-beacon` | `BlogBuddyViewBeacon`, `recordView` - counting a read | client |

They are separate on purpose: a sitemap route that needs two pure functions should not
pull React into its graph.

## Counting views

Both `<BlogBuddyPost>` and `useBlogBuddyPost` record a view for you once the post has
rendered. You do not have to wire anything up, and `view_count` on the post keeps
meaning what it did.

It works this way because reading a post used to count itself, server-side, which meant
that endpoint could never be served from a CDN: a cached response never reaches BlogBuddy,
so the number would quietly have become "origin fetches" rather than "readers". Counting
from the browser keeps the count honest *and* lets the read be cached - which is most of
why a post now loads from the edge instead of from us.

Two things worth knowing:

- **It is more accurate than what it replaced.** Counting only happens after a browser has
  run this code, so crawlers are excluded by construction rather than by a list of
  user-agent strings that can never be complete. The same reader reloading inside a short
  window is counted once.
- **On the server-rendered path, your API key reaches the page.** The beacon is a client
  component, so `apiKey` is serialized into the HTML. That key is blog-scoped and meant to
  be publishable - it opens that blog's published posts and nothing else, and it is exactly
  what the browser hooks already send - but if you would rather it never left your server,
  pass `countViews={false}` and nothing is counted.

`countViews={false}` is also the right switch for a preview route, or your own admin view
of a page, where a read is not a reader:

```tsx
<BlogBuddyPost {...blog} slug={slug} countViews={false} />
```

## Next.js Cache Components

If your `next.config.ts` sets `cacheComponents: true`, Next no longer caches `fetch`
implicitly. Data is either inside a `"use cache"` boundary, which can be prerendered, or
it counts as runtime data. This SDK fetches over the network, so `generateMetadata` fails
the build:

```
Next.js encountered uncached or runtime data in `generateMetadata()`.
This route's metadata is blocked, but the rest of its content can be prerendered.
```

Only the metadata is affected. `<BlogBuddyList>` and `<BlogBuddyPost>` prerender fine,
because a component can suspend and Next can stream it.

Wrap the metadata helper in a cache boundary. On an index page:

```ts
const blogMetadata = blogBuddyMetadata(blog)

export async function generateMetadata() {
  "use cache"
  return blogMetadata()
}
```

On a post page, pass the route props through:

```ts
const postMetadata = blogBuddyMetadata(blog)

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  "use cache"
  return postMetadata(props)
}
```

The default cache profile revalidates every 15 minutes. Use `cacheLife` inside the same
function to change that.

The SDK cannot do this for you. `"use cache"` only compiles when `cacheComponents` is
enabled, so shipping it inside the package would break every consumer who has not turned
the flag on. The boundary has to be declared in your app.

## Requirements

React 18+. `@blogbuddy/sdk/server` and `@blogbuddy/sdk/json-ld` expect a React Server
Components runtime (Next.js App Router or equivalent) and throw a message pointing at
`BlogBuddy.Post` if they are bundled into a browser build instead. `/renderer` and
`/hooks` are client-side and need no framework. Everything else works anywhere.
