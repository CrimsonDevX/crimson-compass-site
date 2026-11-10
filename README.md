# Crimson Compass · Corey King portfolio and blog

Astro site with GSAP scroll motion, Lenis smooth scrolling, a Three.js constellation hero,
Astro view transitions, and an animated SVG Crimson Compass logo.

## Run it locally
    npm install
    npm run dev        # http://localhost:4321

## Write a new blog post
1. Add a Markdown file to `src/content/blog/`, for example `my-new-post.md`.
2. Start it with:

       ---
       title: My post title
       description: One sentence summary.
       date: 2026-11-20
       tags: [AI, Azure]
       cover: agents        # retrieval, agents, or adoption
       ---

3. Push to GitHub. Cloudflare rebuilds and publishes it automatically.

Set `draft: true` to keep a post off the site.

## Deploy on Cloudflare Pages (one time)
1. Create a GitHub repo (for example `crimson-compass-site`) and push this folder.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: Framework preset **Astro**, build command `npm run build`, output folder `dist`.
4. After the first deploy: Custom domains → add `resume.thecrimsoncompass.com`.
5. Optional: turn on Web Analytics for the project.

## Where things live
- `src/pages/index.astro` : home page content (work, experience, skills)
- `src/content/blog/` : blog posts
- `src/components/Logo.astro` : the logo as SVG layers
- `src/components/PostCover.astro` : generated cover art for posts
- `src/scripts/motion.ts` : all scroll and logo animation
- `src/scripts/constellation.ts` : the 3D hero
- `src/styles/global.css` : brand colors and fonts
- `public/Corey_King_Resume.pdf` : the resume download
