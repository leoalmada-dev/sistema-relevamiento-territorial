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
  BackendBorradorServidorItem,
  BackendFinalizationMode,
  FinalizarRelevamientoBackendResult,
  GuardarBorradorServidorParams,
  GuardarBorradorServidorResult,
} from '../types/relevamientoBackend';

const DEFAULT_FINALIZATION_MODE: BackendFinalizationMode = 'local';

export type BackendValidationErrorItem = {
  backendPath: string;
  frontendPath: string;
  message: string;
};

export class BackendValidationError extends Error {
  validationErrors: BackendValidationErrorItem[];

  constructor(validationErrors: BackendValidationErrorItem[]) {
    super('El backend rechazó la carga por errores de validación.');
    this.name = 'BackendValidationError';
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, BackendValidationError.prototype);
  }
}


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

function shouldTreatBackendApiPayloadAsError(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as Record<string, unknown>;
  const code = record.code;
  const status = record.status;

  return (
    (typeof code === 'number' && code >= 400) ||
    status === 'error_validacion'
  );
}

function normalizeBackendMessage(message: string) {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isBackendValidationErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return (payload as Record<string, unknown>).status === 'error_validacion';
}

function mapBackendValidationPathToFrontend(backendPath: string) {
  return backendPath
    .replace(/^draft\./, '')
    .replace(/\.beneficiario_regularizacion\b/g, '.beneficiarioRegularizacion')
    .replace(/\.documento\b/g, '.cedula');
}

function getBackendValidationUserMessage(backendPath: string, message: string) {
  const normalizedMessage = normalizeBackendMessage(message);
  const normalizedPath = normalizeBackendMessage(backendPath);

  if (
    normalizedPath.includes('.personas.') &&
    normalizedPath.endsWith('.documento') &&
    normalizedMessage.includes('ya ha sido registrado')
  ) {
    return 'La cédula ingresada ya figura registrada en el sistema. Revisá el dato de la persona indicada antes de finalizar.';
  }

  if (
    normalizedPath.includes('.personas.') &&
    normalizedPath.endsWith('.edad') &&
    normalizedMessage.includes('mayor que 120')
  ) {
    return 'La edad no debe ser mayor que 120.';
  }

  return message;
}

function extractBackendValidationErrors(payload: unknown): BackendValidationErrorItem[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const errors = (payload as Record<string, unknown>).errors;

  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return [];
  }

  return Object.entries(errors as Record<string, unknown>).flatMap(
    ([backendPath, rawMessages]) => {
      const messages = Array.isArray(rawMessages) ? rawMessages : [rawMessages];

      return messages
        .map((rawMessage) => String(rawMessage ?? '').trim())
        .filter(Boolean)
        .map((message) => ({
          backendPath,
          frontendPath: mapBackendValidationPathToFrontend(backendPath),
          message: getBackendValidationUserMessage(backendPath, message),
        }));
    },
  );
}

function buildBackendValidationError(payload: unknown) {
  if (!isBackendValidationErrorPayload(payload)) {
    return null;
  }

  const validationErrors = extractBackendValidationErrors(payload);

  if (validationErrors.length > 0) {
    return new BackendValidationError(validationErrors);
  }

  return new BackendValidationError([
    {
      backendPath: 'backend',
      frontendPath: 'backend',
      message: getBackendErrorMessage(
        payload,
        'El backend rechazó la carga por errores de validación.',
      ),
    },
  ]);
}

export function isPredioConCargaExistenteError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalizedMessage = normalizeBackendMessage(message);

  return (
    normalizedMessage.includes('ya existe un borrador') &&
    (normalizedMessage.includes('prdio') || normalizedMessage.includes('predio'))
  );
}

async function requestBackendRawJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
    ? ((await response.json()) as T)
    : ({ message: await response.text() } as T);

  const backendValidationError = buildBackendValidationError(payload);

  if (backendValidationError) {
    throw backendValidationError;
  }

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

async function requestBackendJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<BackendApiResponse<T>> {
  const payload = await requestBackendRawJson<BackendApiResponse<T>>(path, options);
  const backendValidationError = buildBackendValidationError(payload);

  if (backendValidationError) {
    throw backendValidationError;
  }

  if (shouldTreatBackendApiPayloadAsError(payload)) {
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

async function getBackendRawJson<T>(path: string) {
  return requestBackendRawJson<T>(path);
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

export async function listarBorradoresServidorPendientes() {
  if (getRelevamientoFinalizationMode() === 'local') {
    return [];
  }

  const response = await getBackendRawJson<BackendBorradorServidorItem[]>('/borrador/all');

  return Array.isArray(response) ? response : [];
}

export async function listarBorradoresServidorPorPredio(predioId: string | number) {
  if (getRelevamientoFinalizationMode() === 'local') {
    return [];
  }

  const response = await getBackendJson<BackendBorradorServidorItem[]>(
    `/borrador/predios/${encodeURIComponent(String(predioId))}`,
  );

  return Array.isArray(response.datos) ? response.datos : [];
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
