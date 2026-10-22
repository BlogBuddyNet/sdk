# @blogbuddy/sdk

Render a [BlogBuddy](https://blogbuddy.net) blog on your own site.

Your posts are served from **your** domain, so the SEO value is yours - which also means
the canonical tags, link previews and sitemap have to come from your site. This package
generates them; you serve them.

Full documentation: **[blogbuddy.net/docs](https://blogbuddy.net/docs)**

```bash
npm install @blogbuddy/sdk
```

## Next.js

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

A post page:

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
structured data, and a prerendered page per post. Put your own header and footer around
the component; the page is still yours.

An index page:

```tsx
// app/blog/page.tsx
import { BlogBuddyList, blogBuddyMetadata } from '@blogbuddy/sdk/server'

export const generateMetadata = blogBuddyMetadata(blog, { title: 'Blog' })

export default async function Page({ searchParams }) {
  return <BlogBuddyList {...blog} perPage={10} page={Number((await searchParams).page) || 1} />
}
```

Sitemap and feeds:

```ts
// app/sitemap.ts
export default blogBuddySitemap(blog)

// app/blog/feed.xml/route.ts
export const GET = blogBuddyFeed(blog)
```

## Vite, Create React App, and other single-page apps

`BlogBuddyPost` and `BlogBuddyList` are React Server Components and will not run in a
build with no server. Use the browser renderer instead:

```tsx
import { BlogBuddy } from '@blogbuddy/sdk/renderer'

<BlogBuddy.List blog="your-blog-slug" apiKey={KEY} perPage={10} />
<BlogBuddy.Post blog="your-blog-slug" apiKey={KEY} slug={slug} />
```

Same design, same fonts, same per-block CSS - drawn by the browser rather than returned
as HTML. Two consequences worth knowing before you choose it:

- **Link previews do not work, and cannot be made to.** Slack, X, Facebook, LinkedIn and
  iMessage run no JavaScript. They read the HTML your server returned, which for a
  single-page app is the same empty shell for every route.
- **Your API key ships in the bundle.** Scope it read-only to one blog, so the worst a
  lifted key can do is read posts that are already public.

## Requirements

React 18+. `@blogbuddy/sdk/server` and `@blogbuddy/sdk/json-ld` need a React Server
Components runtime and throw a message pointing at `BlogBuddy.Post` if they are bundled
into a browser build instead. `/renderer` and `/hooks` are client-side and need no
framework. Everything else works anywhere.
