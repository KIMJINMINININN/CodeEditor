import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';

const client = new QueryClient();

export const MonacoSuiteProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
);
