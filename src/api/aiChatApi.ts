import { axiosInstance } from './axiosInstance';
import { getAccessToken } from './tokenStorage';
import type {
  AiChatRequest,
  AiChatResponse,
  ApiResponse,
  RagSearchResult,
} from '../types';

interface AiChatStreamHandlers {
  onSession?: (sessionId: string) => void;
  onMessage?: (chunk: string) => void;
  onSources?: (sources: RagSearchResult[]) => void;
  onDone?: (response: AiChatResponse) => void;
  onError?: (message: string) => void;
}

interface SseEvent {
  event: string;
  data: string;
}

const parseSseEvent = (rawEvent: string): SseEvent | null => {
  if (!rawEvent.trim()) return null;

  const lines = rawEvent.split('\n');
  let event = 'message';
  let hasEvent = false;
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      hasEvent = true;
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).replace(/^ /, ''));
    }
  });

  if (!hasEvent && dataLines.length === 0) return null;

  return {
    event,
    data: dataLines.join('\n'),
  };
};

const parseJson = <T>(value: string): T => JSON.parse(value) as T;

const handleStreamEvent = (
  sseEvent: SseEvent,
  handlers: AiChatStreamHandlers,
) => {
  switch (sseEvent.event) {
    case 'session':
      handlers.onSession?.(sseEvent.data);
      return null;
    case 'message':
      handlers.onMessage?.(sseEvent.data);
      return null;
    case 'sources': {
      const sources = parseJson<RagSearchResult[]>(sseEvent.data);
      handlers.onSources?.(sources);
      return null;
    }
    case 'done': {
      const response = parseJson<AiChatResponse>(sseEvent.data);
      handlers.onDone?.(response);
      return response;
    }
    case 'error':
      handlers.onError?.(sseEvent.data);
      throw new Error(sseEvent.data);
    default:
      return null;
  }
};

export const sendAiChatMessage = async (request: AiChatRequest) => {
  const response = await axiosInstance.post<ApiResponse<AiChatResponse>>(
    '/ai/chat',
    request,
  );

  return response.data;
};

export const streamAiChatMessage = async (
  request: AiChatRequest,
  handlers: AiChatStreamHandlers = {},
) => {
  const headers: HeadersInit = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  };
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorResponse = (await response
      .json()
      .catch(() => null)) as ApiResponse<unknown> | null;

    if (errorResponse && !errorResponse.success) {
      throw new Error(errorResponse.error.message);
    }

    throw new Error('AI 추천 스트림 요청에 실패했습니다.');
  }

  if (!response.body) {
    throw new Error('AI 추천 스트림을 읽을 수 없습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneResponse: AiChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    while (buffer.includes('\n\n')) {
      const separatorIndex = buffer.indexOf('\n\n');
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const sseEvent = parseSseEvent(rawEvent);

      if (!sseEvent) continue;

      const eventResult = handleStreamEvent(sseEvent, handlers);
      if (eventResult) {
        doneResponse = eventResult;
      }
    }
  }

  const remainingEvent = parseSseEvent(buffer.trim());

  if (remainingEvent) {
    const eventResult = handleStreamEvent(remainingEvent, handlers);
    if (eventResult) {
      doneResponse = eventResult;
    }
  }

  if (!doneResponse) {
    throw new Error('AI 추천 스트림이 완료되지 않았습니다.');
  }

  return doneResponse;
};
