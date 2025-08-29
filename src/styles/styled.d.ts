// src/styles/styled.d.ts
import 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        bg: string;
        bg2: string;
        bg3: string;
        border: string;
        text: string;
        textMute: string;
        accent: string;
        sel: string;
    }
}
