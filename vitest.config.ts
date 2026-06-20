import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^@xyflow\/react\/.*\.css$/, replacement: fileURLToPath(new URL('./src/__mocks__/empty.css', import.meta.url)) },
      // @xyflow/react is mocked intentionally: the integration test is canvas-blind on purpose; the canvas mapping is covered by skillTreeGraph tests.
      { find: '@xyflow/react', replacement: fileURLToPath(new URL('./src/__mocks__/xyflow-react.tsx', import.meta.url)) },
    ],
  },
});
