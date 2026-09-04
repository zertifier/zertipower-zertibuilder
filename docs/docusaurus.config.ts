import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Zertipower / Ris3CAT',
  tagline: 'Documentación técnica: arquitectura, entorno local y despliegue',
  favicon: 'img/favicon.ico',

  // Dominio público del sitio. Se usa para las URL canónicas, el sitemap
  // y las etiquetas Open Graph: si no coincide con el dominio real, los
  // enlaces compartidos y el SEO apuntan a un sitio que no existe.
  //
  // Se lee de DOCS_URL para poder desplegar el mismo código en varios
  // dominios (producción, preproducción) sin tocar el código. Docusaurus
  // fija este valor al COMPILAR, no al arrancar: por eso en Docker se
  // pasa como build arg y no como variable del contenedor.
  url: process.env.DOCS_URL || 'https://ris3cat-docs.zdevutils.com',
  baseUrl: process.env.DOCS_BASE_URL || '/',

  organizationName: 'zertifier',
  projectName: 'zertipower-zertibuilder',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
    navbar: {
      title: 'Zertipower / Ris3CAT',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          href: 'https://github.com/zertifier/zertipower-zertibuilder',
          label: 'Monorepo',
          position: 'right',
        },
        {
          href: 'https://github.com/zertifier/ris3cat-smart-meter',
          label: 'Smart Meter',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {label: 'Introducción', to: '/'},
            {label: 'Base de datos', to: '/base-de-datos/seed-minimo'},
            {label: 'Configuración', to: '/configuracion/variables-entorno'},
            {label: 'Solución de problemas', to: '/troubleshooting'},
          ],
        },
        {
          title: 'Repositorios',
          items: [
            {
              label: 'zertipower-zertibuilder',
              href: 'https://github.com/zertifier/zertipower-zertibuilder',
            },
            {
              label: 'ris3cat-smart-meter',
              href: 'https://github.com/zertifier/ris3cat-smart-meter',
            },
          ],
        },
      ],
      copyright: `Zertipower / Ris3CAT — documentación técnica interna.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'nginx', 'ini', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
