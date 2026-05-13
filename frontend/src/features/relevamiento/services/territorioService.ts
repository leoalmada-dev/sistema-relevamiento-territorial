import {
  adaptCuadranteOption,
  adaptPredioDetalle,
  adaptPredioOption,
  adaptZonaOption,
} from '../adapters/territorioAdapters';
import {
  cuadrantesMock,
  prediosDetalleMock,
  prediosMock,
  zonasMock,
} from '../mock/territorioMock';
import type { CuadranteOption, PredioDetalle, PredioOption, ZonaOption } from '../types/territorio';

export function getZonas(): ZonaOption[] {
  return zonasMock.map(adaptZonaOption);
}

export function getCuadrantesByZona(zonaId: string): CuadranteOption[] {
  return cuadrantesMock
    .filter((cuadrante) => cuadrante.zonaId === zonaId)
    .map(adaptCuadranteOption);
}

export function getPrediosByCuadrante(cuadranteId: string): PredioOption[] {
  return prediosMock
    .filter((predio) => predio.cuadranteId === cuadranteId)
    .map(adaptPredioOption);
}

export function getPredioById(predioId: string): PredioDetalle | null {
  const predio = prediosDetalleMock.find((predioDetalle) => predioDetalle.id === predioId);

  if (!predio) {
    return null;
  }

  return adaptPredioDetalle(predio);
}
