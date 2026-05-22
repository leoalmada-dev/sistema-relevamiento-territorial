import {
  buildBackendBorradorCreatePayload,
  buildBackendRelevamientoCreatePayload,
  type RelevamientoBackendSnapshot,
} from '../adapters/relevamientoBackendAdapter';
import type {
  BackendApiResponse,
  BackendBorradorCreateResponseData,
  BackendFinalizationMode,
  FinalizarRelevamientoBackendResult,
} from '../types/relevamientoBackend';

const DEFAULT_FINALIZATION_MODE: BackendFinalizationMode = 'local';

function getApiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
}

export function getRelevamientoFinalizationMode(): BackendFinalizationMode {
  return import.meta.env.VITE_RELEVAMIENTO_FINALIZATION_MODE === 'backend'
    ? 'backend'
    : DEFAULT_FINALIZATION_MODE;
}

function getBackendErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload !== 'object' || payload === null) {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const message = record.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

async function requestBackendJson<T>(
  path: string,
  options: RequestInit,
): Promise<BackendApiResponse<T>> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error('No está configurada la URL del backend para finalizar el relevamiento.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getBackendErrorMessage(
        payload,
        `No se pudo guardar la información. Código ${response.status}.`,
      ),
    );
  }

  return payload as BackendApiResponse<T>;
}

async function postBackendJson<T>(path: string, body: unknown) {
  return requestBackendJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function extractBorradorId(response: BackendApiResponse<BackendBorradorCreateResponseData>) {
  const borradorId = response.datos?.id;

  if (typeof borradorId !== 'number' || !Number.isFinite(borradorId)) {
    throw new Error('El backend no devolvió un identificador válido de borrador.');
  }

  return borradorId;
}

export async function finalizarRelevamientoBackend(
  snapshot: RelevamientoBackendSnapshot,
): Promise<FinalizarRelevamientoBackendResult> {
  const finalizationMode = getRelevamientoFinalizationMode();

  if (finalizationMode === 'local') {
    return {
      mode: 'local',
      message: 'Información guardada correctamente.',
    };
  }

  const borradorPayload = buildBackendBorradorCreatePayload(snapshot);
  const borradorResponse = await postBackendJson<BackendBorradorCreateResponseData>(
    '/borrador/create',
    borradorPayload,
  );
  const borradorId = extractBorradorId(borradorResponse);
  const relevamientoPayload = buildBackendRelevamientoCreatePayload(
    borradorId,
    borradorPayload,
  );
  const relevamientoResponse = await postBackendJson<unknown>(
    '/relevamiento/create',
    relevamientoPayload,
  );

  return {
    mode: 'backend',
    borradorId,
    message: relevamientoResponse.message || 'Información guardada correctamente.',
  };
}
