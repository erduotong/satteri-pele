import { defineConfig } from 'tsdown';

export default defineConfig({
  dts: true,
  exports: true,
  copy: [{ from: '../../README.md', to: '.' }],
});
