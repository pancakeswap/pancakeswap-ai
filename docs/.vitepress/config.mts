import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PancakeSwap AI',
  description: 'AI tools for building on PancakeSwap — skills, plugins, and agents for any coding agent.',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap' }],
  ],
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/getting-started/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Skills', link: '/skills/' },
      { text: 'Evals', link: '/evals/' },
      {
        text: 'Resources',
        items: [
          { text: 'PancakeSwap Docs', link: 'https://developer.pancakeswap.finance/' },
          { text: 'PancakeSwap App', link: 'https://pancakeswap.finance/' },
          { text: 'GitHub', link: 'https://github.com/pancakeswap/pancakeswap-ai' },
        ],
      },
    ],
    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start', link: '/getting-started/quick-start' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Overview', link: '/plugins/' },
            { text: 'pancakeswap-driver', link: '/plugins/pancakeswap-driver' },
            { text: 'pancakeswap-farming', link: '/plugins/pancakeswap-farming' },
          ],
        },
      ],
      '/skills/': [
        {
          text: 'Skills',
          items: [
            { text: 'Overview', link: '/skills/' },
            { text: 'swap-planner', link: '/skills/swap-planner' },
            { text: 'liquidity-planner', link: '/skills/liquidity-planner' },
            { text: 'farming-planner', link: '/skills/farming-planner' },
          ],
        },
      ],
      '/evals/': [
        {
          text: 'Evaluations',
          items: [
            { text: 'Overview', link: '/evals/' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/pancakeswap/pancakeswap-ai' },
    ],
    editLink: {
      pattern: 'https://github.com/pancakeswap/pancakeswap-ai/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 PancakeSwap',
    },
    search: {
      provider: 'local',
    },
  },
})
