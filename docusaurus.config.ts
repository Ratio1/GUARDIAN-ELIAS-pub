import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'GUARDIAN',
  tagline:
    'Green, user-guided, auditable edge AI for renewable-storage monitoring and operations-center co-piloting',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    faster: {
      // The production host builds from a fresh clone on every deploy, so an
      // on-disk bundler cache is never reused; disabling it cuts peak build
      // memory by roughly 90 MB and keeps the build within a 512 MB container.
      rspackPersistentCache: false,
    },
  },

  // Set the production url of this site here
  url: 'https://edge-guardian.eu',
  // Set the /<baseUrl>/ pathname under which the site is served
  baseUrl: '/',

  organizationName: 'Ratio1',
  projectName: 'GUARDIAN-ELIAS-pub',

  // Broken internal links fail the build; external links are not checked by these settings.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    mermaid: true,
    // Documented replacement for the deprecated top-level
    // `onBrokenMarkdownLinks` config option (Docusaurus 3.10).
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // Even if this site doesn't use internationalization, this field sets
  // useful metadata like html lang.
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
          editUrl: 'https://github.com/Ratio1/GUARDIAN-ELIAS-pub/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/Ratio1/GUARDIAN-ELIAS-pub/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      // Fully local search index, built at compile time — no external
      // service, no tracking, no network calls at runtime.
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',
      },
    ],
  ],

  themeConfig: {
    // No analytics, no external fonts, no tracking of any kind.
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GUARDIAN',
      logo: {
        alt: 'GUARDIAN shield mark',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'wikiSidebar',
          position: 'left',
          label: 'Wiki',
        },
        {to: '/blog', label: 'News', position: 'left'},
        {to: '/docs/about', label: 'About', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Wiki',
          items: [
            {label: 'About GUARDIAN', to: '/docs/about'},
            {label: 'ELIAS & The Open Call', to: '/docs/elias'},
            {label: 'Project', to: '/docs/project/work-plan'},
            {label: 'Technology', to: '/docs/technology/ratio1-platform'},
            {label: 'Use Cases', to: '/docs/use-cases/energy-monitoring'},
            {label: 'Results & Downloads', to: '/docs/results'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'News', to: '/blog'},
            {label: 'Contact & Imprint', to: '/docs/contact'},
            {
              label: 'GitHub',
              href: 'https://github.com/Ratio1/GUARDIAN-ELIAS-pub',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Naeural SRL. Site content licensed under CC BY 4.0 (see LICENSE-content.md); site configuration code licensed under MIT (see LICENSE).`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
