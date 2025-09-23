import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChatMessage } from './streamChatMessage';

// Minimal fetch mock result
function mockFetchResponse(ok: boolean) {
  return {
    ok,
    status: ok ? 200 : 400,
    headers: { get: (_k: string) => (ok ? 'text/event-stream' : 'application/json') },
    // we won't consume the body in these tests
    body: undefined as any
  } as unknown as Response;
}

describe('streamChatMessage payload', () => {
  const origFetch = globalThis.fetch;
  const origLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    // @ts-expect-error - define minimal localStorage
    globalThis.localStorage = {
      getItem: (key: string) => (key === 'token' ? 'TEST_TOKEN' : null)
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockFetchResponse(false));
  });

  afterEach(() => {
    globalThis.fetch = origFetch as any;
    // @ts-expect-error restore
    globalThis.localStorage = origLocalStorage;
    vi.restoreAllMocks();
  });

  it('includes prompt, persona, and preview_config (urlencoded)', async () => {
    const onChunk = vi.fn();
    const onError = vi.fn();

    const controller = streamChatMessage({
      chatId: 'chat_123',
      prompt: 'Explain the Pythagorean theorem and give a quick practice problem.',
      persona: 'struggling_student',
      previewConfig: { name: 'Swift Tutor', capabilities: { webSearch: false } },
      onChunk,
      onError
    });

    // Allow the internal async IIFE to run
    await new Promise((r) => setTimeout(r, 0));

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [_url, opts] = (globalThis.fetch as any).mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toContain('application/x-www-form-urlencoded');

    // Body is URLSearchParams or a string
    const bodyStr = typeof opts.body === 'string' ? opts.body : (opts.body as URLSearchParams).toString();
    const params = new URLSearchParams(bodyStr);

    expect(params.get('prompt')).toContain('Pythagorean');
    expect(params.get('persona')).toBe('struggling_student');

    const pc = params.get('preview_config');
    expect(pc).toBeTruthy();
    const parsed = JSON.parse(pc!);
    expect(parsed.name).toBe('Swift Tutor');
    expect(parsed.capabilities?.webSearch).toBe(false);

    // should return a handle with close()
    expect(controller).toHaveProperty('close');
  });

  it('omits persona when not provided', async () => {
    const onChunk = vi.fn();

    streamChatMessage({
      chatId: 'chat_abc',
      prompt: 'Test prompt',
      onChunk
    });

    await new Promise((r) => setTimeout(r, 0));

    const [_url, opts] = (globalThis.fetch as any).mock.calls[0];
    const bodyStr = typeof opts.body === 'string' ? opts.body : (opts.body as URLSearchParams).toString();
    const params = new URLSearchParams(bodyStr);

    expect(params.get('persona')).toBe(null);
    expect(params.get('prompt')).toBe('Test prompt');
  });
});

