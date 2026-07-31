# CvFy

[![MadeWithVueJs.com shield](https://madewithvuejs.com/storage/repo-shields/3280-shield.svg)](https://madewithvuejs.com/p/cvfy/shield-link)

![CvFy](/public/CvFy.png)

CvFy is an open-sourced multilingual app that makes CV creation faster and easier.

> [!NOTE]
> PDF creation is client-side only, so results may differ among browsers.

Demo: http://cv.xio.vn/

## Features
- Multilingual
- Custom themes (layout and color)
- No login required
- Responsive design
- Accessible
- SEO
- PWA
- Offline

## Tech Stack
- HTML
- TypeScript
- PostCSS
- TailwindCSS
- Nuxt 3
- Cloudflare Pages

## Cloudflare Pages deployment secrets
To run the GitHub Actions deployment workflow, configure these repository secrets:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with permission to deploy to Pages
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID for the target Pages project (`cvfy`)
