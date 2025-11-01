import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Testing y Seguridad - Máster Full Stack',
  tagline: 'Aprende a construir aplicaciones robustas, confiables y seguras',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/lucferbux/Taller-Docusaurus/tree/main/',
        },
        blog: false, // Deshabilitar el blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Testing y Seguridad',
      logo: {
        alt: 'Testing y Seguridad Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Contenido',
        },
        {
          href: 'https://github.com/lucferbux/Taller-Docusaurus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Contenido',
          items: [
            {
              label: 'Inicio',
              to: '/',
            },
            {
              label: 'Documentación',
              to: '/docs/',
            },
          ],
        },
        {
          title: 'Sesiones',
          items: [
            {
              label: 'Testing Unitario',
              to: '/docs/sesion-01/intro',
            },
            {
              label: 'Testing de Integración',
              to: '/docs/sesion-02/intro',
            },
            {
              label: 'Testing E2E con Cypress',
              to: '/docs/sesion-03/intro',
            },
            {
              label: 'Seguridad',
              to: '/docs/sesion-04/intro',
            },
          ],
        },
        {
          title: 'Recursos',
          items: [
            {
              label: 'Jest',
              href: 'https://jestjs.io/',
            },
            {
              label: 'Cypress',
              href: 'https://www.cypress.io/',
            },
            {
              label: 'OWASP Top 10',
              href: 'https://owasp.org/www-project-top-ten/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/lucferbux/Taller-Docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Máster Full Stack - Testing y Seguridad. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
