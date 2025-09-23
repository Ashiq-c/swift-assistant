export function streamChatMessage({
  chatId,
  prompt,
  persona,
  previewConfig,
  onChunk,
  onError,
  onDone
}: {
  chatId: string;
  prompt: string;
  persona?: string | null;
  previewConfig?: any;
  onChunk: (text: string) => void;
  onError?: (err: any) => void;
  onDone?: () => void;
}) {
  const controller = new AbortController();
  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}api/v1/chat/${chatId}/`;

  const payload = new URLSearchParams();
  payload.append('prompt', prompt);
  if (persona) payload.append('persona', persona);
  if (previewConfig) {
    try { payload.append('preview_config', JSON.stringify(previewConfig)); } catch {}
  }

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/event-stream, application/json;q=0.9, */*;q=0.8'
        },
        body: payload.toString(),
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!res.ok || !res.body) {
        const err = { status: res.status, statusText: res.statusText };
        console.error('❌ Stream start error:', err);
        onError?.(err);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          // Parse SSE lines
          const lines = chunk.split('\n');
          let eventType = 'message';
          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }
          if (dataLines.length === 0) continue;

          const data = dataLines.join('\n');
          if (data === '[DONE]') {
            onDone?.();
            controller.abort();
            return;
          }

          if (eventType === 'error') {
            try {
              const parsed = JSON.parse(data);
              onError?.(parsed);
            } catch {
              onError?.(data);
            }
            continue;
          }

          onChunk(data);
        }
      }

      onDone?.();
    } catch (e) {
      if ((e as any)?.name === 'AbortError') {
        // silent on manual close
      } else {
        console.error('❌ Stream exception:', e);
        onError?.(e);
      }
    }
  })();

  return {
    close: () => controller.abort()
  };
}
