import { describe, expect, it } from 'vitest';
import { safeAdminRedirect } from './auth-api';

describe('safeAdminRedirect', () => {
  it.each([null, '//evil.test', 'https://evil.test', '/admin/../../checkout', '/admin/login', '/admin\\evil', '/admin/../login', '/admin/\r\nevil'])('rejects unsafe destination %s', (value) => {
    expect(safeAdminRedirect(value)).toBe('/admin/products');
  });
  it('preserves an internal catalog destination and query', () => {
    expect(safeAdminRedirect('/admin/products/9007199254740993?edit=true')).toBe('/admin/products/9007199254740993?edit=true');
  });
});
