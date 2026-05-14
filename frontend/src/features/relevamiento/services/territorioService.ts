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

async function requestTerritorioJson(path: string): Promise<unknown> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error('Falta configurar VITE_API_BASE_URL para usar territorio desde API.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al consultar territorio.`);
  }

  return response.json();
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
  return getTerritorioDataSource() === 'api' ? 'API real' : 'mocks locales';
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
