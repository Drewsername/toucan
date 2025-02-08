import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Toucan',
  tagline: 'Gamified Couple Task and Favor App',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.toucan.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'toucan', // Usually your GitHub org/user name.
  projectName: 'toucan', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/toucan-social-card.jpg',
    navbar: {
      title: 'Toucan',
      logo: {
        alt: 'Toucan Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/backend/database',
          label: 'Backend',
          position: 'left',
        },
        {
          to: '/frontend/architecture',
          label: 'Frontend',
          position: 'left',
        },
        {
          to: '/development/setup',
          label: 'Getting Started',
          position: 'left',
        },
        {
          href: 'https://github.com/toucan/toucan',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/development/setup',
            },
            {
              label: 'Backend',
              to: '/backend/database',
            },
            {
              label: 'Frontend',
              to: '/frontend/architecture',
            },
          ],
        },
        {
          title: 'Development',
          items: [
            {
              label: 'Workflow',
              to: '/development/workflow',
            },
            {
              label: 'Testing',
              to: '/development/testing',
            },
            {
              label: 'API Reference',
              to: '/backend/api',
            },
          ],
        },
        {
          title: 'Infrastructure',
          items: [
            {
              label: 'Deployment',
              to: '/infrastructure/deployment',
            },
            {
              label: 'Monitoring',
              to: '/infrastructure/monitoring',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/toucan/toucan',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Toucan.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
