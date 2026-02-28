import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PancakeSwap AI',
  description: 'AI tools for building on PancakeSwap — skills, plugins, and agents for any coding agent.',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  themeConfig: {
    logo: '/logo.png',
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
            { text: 'pancakeswap-trading', link: '/plugins/pancakeswap-trading' },
            { text: 'pancakeswap-driver', link: '/plugins/pancakeswap-driver' },
            { text: 'pancakeswap-infinity', link: '/plugins/pancakeswap-infinity' },
          ],
        },
      ],
      '/skills/': [
        {
          text: 'Skills',
          items: [
            { text: 'Overview', link: '/skills/' },
            { text: 'swap-integration', link: '/skills/swap-integration' },
            { text: 'swap-planner', link: '/skills/swap-planner' },
            { text: 'liquidity-planner', link: '/skills/liquidity-planner' },
            { text: 'infinity-security-foundations', link: '/skills/infinity-security-foundations' },
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
