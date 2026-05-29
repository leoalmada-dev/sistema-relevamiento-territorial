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

export const DOCUMENTO_REGISTRADO_MESSAGE = 'La cédula ingresada ya figura registrada en el sistema. Revisá el dato de la persona indicada antes de continuar.';

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

export function getRelevamientoApiBaseUrl() {
  return getApiBaseUrl();
}

export function getRelevamientoEnvironmentKey() {
  const apiBaseUrl = getApiBaseUrl();
  const finalizationMode = getRelevamientoFinalizationMode();

  return `${finalizationMode}:${apiBaseUrl || 'sin-api-base-url'}`;
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
    (normalizedMessage.includes('ya ha sido registrado') ||
      normalizedMessage.includes('has already been taken'))
  ) {
    return DOCUMENTO_REGISTRADO_MESSAGE;
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

export function isBorradorServidorNoExisteError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalizedMessage = normalizeBackendMessage(message);

  return (
    (normalizedMessage.includes('no query results for model') &&
      normalizedMessage.includes('borrador')) ||
    (normalizedMessage.includes('borrador') &&
      (normalizedMessage.includes('no existe') ||
        normalizedMessage.includes('not found') ||
        normalizedMessage.includes('no encontrado') ||
        normalizedMessage.includes('no encontrada')))
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function truthyExistenceValue(value: unknown) {
  if (value === true || value === 1) {
    return true;
  }

  const normalizedValue = normalizedText(value);

  return ['1', 'true', 'si', 'existe', 'exists', 'registrado', 'encontrado', 'found'].includes(
    normalizedValue,
  );
}

function personaConsultaPayloadIndicaExistencia(value: unknown, depth = 0): boolean {
  if (depth > 2) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (!isRecord(value)) {
    return false;
  }

  const code = value.code;
  const message = normalizedText(value.message);

  if (
    (code === 404 || normalizedText(code) === '404') &&
    (message.includes('fue registrada') ||
      message.includes('registrada') ||
      message.includes('ya existe') ||
      message.includes('has already been taken'))
  ) {
    return true;
  }

  if ((code === 200 || normalizedText(code) === '200') && message.includes('no existe')) {
    return false;
  }

  const existenceBooleanKeys = [
    'existe',
    'exists',
    'registrado',
    'registrada',
    'encontrado',
    'found',
    'personaExiste',
    'documentoRegistrado',
  ];

  if (existenceBooleanKeys.some((key) => truthyExistenceValue(value[key]))) {
    return true;
  }

  const status = normalizedText(value.status ?? value.estado ?? value.resultado);

  if (
    [
      'existe',
      'exists',
      'registrado',
      'registrada',
      'encontrado',
      'found',
      'taken',
      'duplicado',
      'documento_registrado',
    ].includes(status)
  ) {
    return true;
  }

  const personaEvidenceKeys = ['id', 'persona_id', 'documento', 'cedula', 'nombre', 'apellido'];

  if (
    personaEvidenceKeys.some((key) => {
      const fieldValue = value[key];
      return (
        (typeof fieldValue === 'string' && fieldValue.trim()) ||
        (typeof fieldValue === 'number' && Number.isFinite(fieldValue))
      );
    })
  ) {
    return true;
  }

  return ['datos', 'data', 'persona', 'person', 'resultado', 'result'].some((key) =>
    personaConsultaPayloadIndicaExistencia(value[key], depth + 1),
  );
}

export async function consultarPersonaPorDocumento(documento: string) {
  const documentoNormalizado = documento.trim();

  if (!documentoNormalizado || getRelevamientoFinalizationMode() !== 'backend') {
    return false;
  }

  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return false;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/relevamiento/persona/consulta/${encodeURIComponent(documentoNormalizado)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? ((await response.json()) as unknown)
      : ({ message: await response.text() } as unknown);

    return personaConsultaPayloadIndicaExistencia(payload);
  } catch {
    return false;
  }
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
