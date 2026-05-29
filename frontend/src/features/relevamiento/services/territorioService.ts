import {
  adaptCuadrantesFromApi,
  adaptPredioDetallePayloadFromApi,
  adaptPrediosFromApi,
  adaptZonasFromApi,
} from '../adapters/territorioAdapters';
import {
  cuadrantesMock,
  prediosDetalleMock,
  prediosMock,
  zonasMock,
} from '../mock/territorioMock';
import type {
  CuadranteOption,
  CrearPredioInput,
  PredioDetalle,
  PredioOption,
  TerritorioDataSource,
  ZonaOption,
} from '../types/territorio';

const DEFAULT_DATA_SOURCE: TerritorioDataSource = 'mock';

function getApiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
}

function getTerritorioDataSource(): TerritorioDataSource {
  return import.meta.env.VITE_TERRITORIO_DATA_SOURCE === 'api'
    ? 'api'
    : DEFAULT_DATA_SOURCE;
}

function getTerritorioErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const message = record.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const errors = record.errors;

  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const firstError = Object.values(errors as Record<string, unknown>)[0];

    if (Array.isArray(firstError) && firstError.length > 0) {
      return String(firstError[0]);
    }

    if (typeof firstError === 'string' && firstError.trim()) {
      return firstError;
    }
  }

  return fallback;
}

async function requestTerritorioJson(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error('No está configurada la conexión con la red territorial.');
  }

  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getTerritorioErrorMessage(
        payload,
        `No se pudo obtener la información territorial. Código ${response.status}.`,
      ),
    );
  }

  return payload;
}

function getZonasMock(): ZonaOption[] {
  return zonasMock;
}

function getCuadrantesByZonaMock(zonaId: string): CuadranteOption[] {
  return cuadrantesMock.filter((cuadrante) => cuadrante.zonaId === zonaId);
}

function getPrediosByCuadranteMock(cuadranteId: string): PredioOption[] {
  return prediosMock.filter((predio) => predio.cuadranteId === cuadranteId);
}

function getPredioByIdMock(predioId: string): PredioDetalle | null {
  return prediosDetalleMock.find((predio) => predio.id === predioId) ?? null;
}

export function getTerritorioSourceLabel() {
  return getTerritorioDataSource() === 'api' ? 'Red interna' : 'Datos de práctica';
}

export async function getZonas(): Promise<ZonaOption[]> {
  if (getTerritorioDataSource() === 'mock') {
    return getZonasMock();
  }

  const payload = await requestTerritorioJson('/zonas');
  return adaptZonasFromApi(payload);
}

export async function getCuadrantesByZona(zonaId: string): Promise<CuadranteOption[]> {
  if (getTerritorioDataSource() === 'mock') {
    return getCuadrantesByZonaMock(zonaId);
  }

  const payload = await requestTerritorioJson(`/zonas/${zonaId}/cuadrantes`);
  return adaptCuadrantesFromApi(payload, zonaId);
}

export async function getPrediosByCuadrante(cuadranteId: string): Promise<PredioOption[]> {
  if (getTerritorioDataSource() === 'mock') {
    return getPrediosByCuadranteMock(cuadranteId);
  }

  const payload = await requestTerritorioJson(`/cuadrantes/${cuadranteId}/predios`);
  return adaptPrediosFromApi(payload, cuadranteId);
}

export async function getPredioById(predioId: string): Promise<PredioDetalle | null> {
  if (getTerritorioDataSource() === 'mock') {
    return getPredioByIdMock(predioId);
  }

  const payload = await requestTerritorioJson(`/predios/${predioId}`);
  return adaptPredioDetallePayloadFromApi(payload);
}

export async function crearPredio(input: CrearPredioInput): Promise<PredioDetalle> {
  if (getTerritorioDataSource() === 'mock') {
    throw new Error('La creación de predios requiere conexión con la red interna.');
  }

  const payload = await requestTerritorioJson('/predios/create', {
    method: 'POST',
    body: JSON.stringify({
      calle: input.calle,
      nro_puerta: input.nroPuerta,
      id_cuadrante: input.idCuadrante,
    }),
  });

  const predio = adaptPredioDetallePayloadFromApi(payload);

  if (!predio?.id) {
    throw new Error(
      'El predio fue creado, pero la respuesta no pudo interpretarse. Actualizá la lista de predios o consultá con soporte.',
    );
  }

  return predio;
}
