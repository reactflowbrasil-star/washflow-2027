import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sistema de Lava-Rápido | Car Wash Pro',
    short_name: 'Lava-Rápido Pro',
    description: 'Sistema completo de gerenciamento de lava-rápido, caixa, fidelidade e controle financeiro',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1329',
    theme_color: '#2563eb',
    orientation: 'any',
    dir: 'ltr',
    lang: 'pt-BR',
    scope: '/',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Frente de Caixa',
        short_name: 'Caixa',
        description: 'Registro de veículos e recibos do caixa',
        url: '/',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
