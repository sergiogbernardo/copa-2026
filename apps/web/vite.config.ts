/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_API_BASE_URL = 'https://copa-2026-api.sergiogbernardo.workers.dev';

// Served from a GitHub Pages project page: https://<user>.github.io/copa-2026/
export default defineConfig(({ command }) => {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const apiOrigin = new URL(apiBaseUrl).origin;

  return {
    base: '/copa-2026/',
    plugins: [
      react(),
      {
        name: 'production-content-security-policy',
        transformIndexHtml: command === 'build' ? () => securityPolicyTag(apiOrigin) : undefined,
      },
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});

function securityPolicyTag(apiOrigin: string) {
  return [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "script-src 'self'",
          "style-src 'self'",
          "img-src 'self' https: data:",
          `connect-src 'self' ${apiOrigin}`,
          "manifest-src 'self'",
          "worker-src 'self'",
          "form-action 'self'",
        ].join('; '),
      },
      injectTo: 'head-prepend' as const,
    },
  ];
}
