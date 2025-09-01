export const theme = {
    color: { bg: '#0f172a', text: '#e2e8f0', accent: '#60a5fa', border: '#1f2937' }
};

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme {
        color: { bg: string; text: string; accent: string; border: string };
    }
}
