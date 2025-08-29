// src/App.test.tsx
import React from "react";
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

function renderWithProviders(ui: React.ReactNode) {
    const qc = new QueryClient();
    return render(
        <QueryClientProvider client={qc}>
            <ThemeProvider theme={{ colors: { primary: '#4f46e5' } }}>
                {ui}
            </ThemeProvider>
        </QueryClientProvider>
    );
}

test('renders app shell header', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/Monaco ZIP Editor/i)).toBeInTheDocument();
});
