import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import App from './App';
import 'vscode-codicons/dist/codicon.css';
import {darkTheme} from "./styles/theme";

const container = document.getElementById('root')!;
const root = createRoot(container);
const queryClient = new QueryClient();
const theme = { colors: { primary: '#4f46e5' } };

root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={darkTheme}>
                <App />
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>
);
