import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the header and navigation', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /Copa 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Grupos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chaveamento' })).toBeInTheDocument();
  });
});
