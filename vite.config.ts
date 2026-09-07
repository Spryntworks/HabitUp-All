import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'treat-rn-expo-js',
        async transform(code, id) {
          if (id.includes('@react-native/assets-registry') || id.includes('assets-registry/registry')) {
            return {
              code: `
                'use strict';
                const assets = [];
                export function registerAsset(asset) { return assets.push(asset); }
                export function getAssetByID(assetId) { return assets[assetId - 1]; }
                export default { registerAsset, getAssetByID };
              `,
              map: null,
            };
          }
          if (
            (id.includes('expo') || id.includes('react-native') || id.includes('@react-native')) &&
            (id.endsWith('.js') || id.endsWith('.jsx'))
          ) {
            if (code.includes('<') || code.includes('export type') || code.includes('import type') || code.includes('interface ')) {
              const esbuild = await import('esbuild');
              const res = esbuild.transformSync(code, {
                loader: 'tsx',
                jsx: 'automatic',
              });
              return {
                code: res.code,
                map: null,
              };
            }
          }
          return null;
        },
      },
      react({
        include: /\.(jsx|js|tsx|ts)$/,
      }),
      tailwindcss(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native$': 'react-native-web',
        'react-native': 'react-native-web',
      },
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
