import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BrandingProvider, useBranding } from './branding';
import defaultLogo from '@/assets/logo.png';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

function setup(initialLogo: string | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><BrandingProvider initialLogo={initialLogo}>{children}</BrandingProvider></QueryClientProvider>;
  return { client, ...renderHook(useBranding, { wrapper }) };
}

describe('Configured branding resolution', () => {
  beforeEach(() => { rpc.mockReset(); });

  it('uses the saved admin logo immediately without a default value', () => {
    const { result } = setup('https://example.com/current-logo.png');
    expect(result.current).toBe('https://example.com/current-logo.png');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not substitute an old logo while the saved setting is unknown', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('offline') });
    const { result, client } = setup(null);
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(client.getQueryState(['branding'])?.status).toBe('error'));
    expect(result.current).toBeUndefined();
  });

  it('uses the bundled logo only after an intentional default reset', () => {
    const { result } = setup('');
    expect(result.current).toBe(defaultLogo);
  });

  it('reads the newly saved logo after admin invalidates branding', async () => {
    rpc.mockResolvedValue({ data: 'https://example.com/replacement.png', error: null });
    const { result, client } = setup('https://example.com/current-logo.png');
    await act(async () => { await client.invalidateQueries({ queryKey: ['branding'] }); });
    expect(result.current).toBe('https://example.com/replacement.png');
  });
});