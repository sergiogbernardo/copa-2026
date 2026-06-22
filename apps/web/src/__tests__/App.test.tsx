import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    // Pin the language so navigation labels are deterministic across environments.
    localStorage.setItem('copa2026:lang', 'pt');
  });

  it('renders the header and navigation', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /Copa 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Grupos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chaveamento' })).toBeInTheDocument();
  });
});
