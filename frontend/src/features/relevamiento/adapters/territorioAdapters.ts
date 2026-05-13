import type { CuadranteOption, PredioDetalle, PredioOption, ZonaOption } from '../types/territorio';

export function adaptZonaOption(zona: ZonaOption): ZonaOption {
  return {
    id: zona.id,
    nombre: zona.nombre,
  };
}

export function adaptCuadranteOption(cuadrante: CuadranteOption): CuadranteOption {
  return {
    id: cuadrante.id,
    zonaId: cuadrante.zonaId,
    nombre: cuadrante.nombre,
  };
}

export function adaptPredioOption(predio: PredioOption): PredioOption {
  return {
    id: predio.id,
    cuadranteId: predio.cuadranteId,
    numeroPuerta: predio.numeroPuerta,
    descripcion: predio.descripcion,
  };
}

export function adaptPredioDetalle(predio: PredioDetalle): PredioDetalle {
  return {
    id: predio.id,
    cuadranteId: predio.cuadranteId,
    numeroPuerta: predio.numeroPuerta,
    descripcion: predio.descripcion,
    calle: predio.calle,
    numeroPuertaTeorico: predio.numeroPuertaTeorico,
    padron: predio.padron,
    manzana: predio.manzana,
    lote: predio.lote,
  };
}
