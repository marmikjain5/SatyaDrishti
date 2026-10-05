import { describe, expect, it } from 'vitest';
import { getNetworkStatusLabel } from './networkStatus';

describe('network status label', () => {
  it('shows Online when the browser reports a connection', () => {
    expect(getNetworkStatusLabel(true)).toBe('Online');
  });

  it('shows Offline when the browser reports no connection', () => {
    expect(getNetworkStatusLabel(false)).toBe('Offline');
  });
});
