import {
  buildBackendBorradorCreatePayload,
  buildBackendBorradorSyncPayload,
  buildBackendRelevamientoCreatePayload,
  type RelevamientoBackendSnapshot,
} from '../adapters/relevamientoBackendAdapter';
import type {
  BackendApiResponse,
  BackendBorradorCreateResponseData,
  BackendBorradorGetResponseData,
  BackendFinalizationMode,
  FinalizarRelevamientoBackendResult,
  GuardarBorradorServidorParams,
  GuardarBorradorServidorResult,
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
  if (!payload || typeof payload !== 'object') {
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
  options: RequestInit = {},
): Promise<BackendApiResponse<T>> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error('No está configurada la URL del backend para finalizar el relevamiento.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as BackendApiResponse<T>)
    : ({ message: await response.text() } as BackendApiResponse<T>);

  if (!response.ok) {
    throw new Error(
      getBackendErrorMessage(
        payload,
        'No se pudo guardar la información. Verifique la conexión e intente nuevamente.',
      ),
    );
  }

  return payload;
}

async function postBackendJson<T>(path: string, body: unknown) {
  return requestBackendJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function getBackendJson<T>(path: string) {
  return requestBackendJson<T>(path);
}

function extractBorradorId(response: BackendApiResponse<BackendBorradorCreateResponseData>) {
  const borradorId = response.datos?.id;

  if (typeof borradorId !== 'number' || !Number.isFinite(borradorId)) {
    throw new Error('El backend no devolvió un identificador válido de borrador.');
  }

  return borradorId;
}

function extractDraftVersion(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}

async function obtenerVersionBorradorServidor(serverDraftId: number) {
  const response = await getBackendJson<BackendBorradorGetResponseData>(
    `/borrador/get/${serverDraftId}`,
  );

  return extractDraftVersion(response.datos?.draft_version);
}

export async function crearBorradorServidor(
  snapshot: RelevamientoBackendSnapshot,
): Promise<GuardarBorradorServidorResult> {
  const payload = buildBackendBorradorCreatePayload(snapshot);
  const response = await postBackendJson<BackendBorradorCreateResponseData>(
    '/borrador/create',
    payload,
  );

  const borradorId = extractBorradorId(response);
  const draftVersion = extractDraftVersion(response.datos?.draft_version) ?? payload.draft_version;

  return {
    mode: 'backend',
    borradorId,
    draftVersion,
    message: response.message || 'Borrador servidor creado correctamente.',
  };
}

export async function sincronizarBorradorServidor(
  snapshot: RelevamientoBackendSnapshot,
  serverDraftId: number,
  serverDraftVersion: number | null,
): Promise<GuardarBorradorServidorResult> {
  const draftVersionToSend = (serverDraftVersion ?? 1) + 1;
  const payload = buildBackendBorradorSyncPayload(
    snapshot,
    serverDraftId,
    draftVersionToSend,
  );

  const response = await postBackendJson<unknown>('/borrador/sincronizar', payload);
  const confirmedDraftVersion =
    extractDraftVersion((response.datos as { draft_version?: unknown } | undefined)?.draft_version) ??
    (await obtenerVersionBorradorServidor(serverDraftId)) ??
    draftVersionToSend;

  return {
    mode: 'backend',
    borradorId: serverDraftId,
    draftVersion: confirmedDraftVersion,
    message: response.message || 'Borrador servidor sincronizado correctamente.',
  };
}

export async function guardarBorradorServidor({
  snapshot,
  serverDraftId,
  serverDraftVersion,
}: GuardarBorradorServidorParams): Promise<GuardarBorradorServidorResult> {
  const finalizationMode = getRelevamientoFinalizationMode();

  if (finalizationMode === 'local') {
    return {
      mode: 'local',
      borradorId: serverDraftId,
      draftVersion: serverDraftVersion,
      message: 'Modo local sin sincronización con backend.',
    };
  }

  if (!serverDraftId) {
    return crearBorradorServidor(snapshot);
  }

  return sincronizarBorradorServidor(snapshot, serverDraftId, serverDraftVersion);
}

export async function finalizarRelevamientoBackend(
  snapshot: RelevamientoBackendSnapshot,
  serverDraftId: number | null = null,
  serverDraftVersion: number | null = null,
): Promise<FinalizarRelevamientoBackendResult> {
  const finalizationMode = getRelevamientoFinalizationMode();

  if (finalizationMode === 'local') {
    return {
      mode: 'local',
      message: 'Información guardada correctamente.',
    };
  }

  const borradorResult = await guardarBorradorServidor({
    snapshot,
    serverDraftId,
    serverDraftVersion,
  });

  if (!borradorResult.borradorId) {
    throw new Error('No se pudo obtener un identificador de borrador servidor.');
  }

  const relevamientoPayload = buildBackendRelevamientoCreatePayload(
    borradorResult.borradorId,
    snapshot,
    borradorResult.draftVersion ?? 1,
  );

  const relevamientoResponse = await postBackendJson<unknown>(
    '/relevamiento/create',
    relevamientoPayload,
  );

  return {
    mode: 'backend',
    borradorId: borradorResult.borradorId,
    draftVersion: borradorResult.draftVersion,
    message: relevamientoResponse.message || 'Información guardada correctamente.',
  };
}
