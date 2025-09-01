import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm','cjs'],
    dts: {
        entry: 'src/index.ts',   // ✅ 선언 번들 시작점 명시
        resolve: true
    },
    tsconfig: 'packages/monaco-core/tsconfig.json', // ✅ 어떤 tsconfig를 쓸지 명시
    target: 'es2022',
    sourcemap: true,
    clean: true,
    splitting: false,
    external: [
        'react', 'react-dom', 'zustand',
        '@tanstack/react-query', 'styled-components'
    ],
});
