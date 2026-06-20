import '@testing-library/jest-dom/vitest';

// React Flow needs ResizeObserver which jsdom does not provide
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
