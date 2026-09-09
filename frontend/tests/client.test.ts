import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildQuery, request } from '../src/shared/api/client';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => body,
  } as Response;
}

describe('buildQuery', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildQuery({})).toBe('');
  });

  it('omits undefined, null and empty-string values', () => {
    expect(buildQuery({ status: undefined, priority: null, sort: '', page: 1 })).toBe('?page=1');
  });

  it('stringifies numbers and booleans', () => {
    expect(buildQuery({ done: true, page: 2 })).toBe('?done=true&page=2');
  });

  it('preserves multiple entries in insertion order', () => {
    expect(buildQuery({ sort: 'effort', order: 'desc' })).toBe('?sort=effort&order=desc');
  });
});

describe('request', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 1 }, { ok: true, status: 200 })));
    await expect(request('/api/tasks')).resolves.toEqual({ id: 1 });
  });

  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: true, status: 204 })));
    await expect(request('/api/tasks/1')).resolves.toBeUndefined();
  });

  it('surfaces a plain backend error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, { ok: false, status: 400 })));
    await expect(request('/api/tasks')).rejects.toThrow('boom');
    await expect(request('/api/tasks')).rejects.toMatchObject({ status: 400 });
  });

  it('surfaces a nested backend error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'nested msg' } }, { ok: false, status: 422 }))
    );
    await expect(request('/api/tasks')).rejects.toThrow('nested msg');
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    const res = {
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError('bad json');
      },
    } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
    await expect(request('/api/tasks')).rejects.toThrow('Request failed with status 500');
  });

  it('throws an ApiError instance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 404 })));
    const error = await request('/api/tasks').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
  });
});