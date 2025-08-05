import { EventSourcePolyfill } from 'event-source-polyfill';

export function streamChatMessage({
  chatId,
  prompt,
  onChunk,
  onError,
  onDone
}: {
  chatId: string;
  prompt: string;
  onChunk: (text: string) => void;
  onError?: (err: any) => void;
  onDone?: () => void;
}) {
  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}api/v1/chat/${chatId}/`;

  const payload = new URLSearchParams();
  payload.append('prompt', prompt);

  const es = new EventSourcePolyfill(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    payload: payload.toString()
  });

  es.onmessage = (event) => {
    if (event.data === '[DONE]') {
      es.close();
      onDone?.();
      return;
    }

    onChunk(event.data);
  };

  es.onerror = (err) => {
    console.error('❌ Stream error:', err);
    es.close();
    onError?.(err);
  };

  return es; // Return so you can call .close() if needed
}
