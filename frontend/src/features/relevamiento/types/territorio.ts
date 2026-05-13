export type ZonaOption = {
  id: string;
  nombre: string;
};

export type CuadranteOption = {
  id: string;
  zonaId: string;
  nombre: string;
};

export type PredioOption = {
  id: string;
  cuadranteId: string;
  numeroPuerta: string;
  descripcion: string;
};

export type PredioDetalle = PredioOption & {
  calle: string;
  numeroPuertaTeorico: string;
  padron: string;
  manzana: string;
  lote: string;
};
