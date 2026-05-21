export type TerritorioDataSource = 'mock' | 'api';

export type ZonaOption = {
  id: string;
  nombre: string;
};

export type CuadranteOption = {
  id: string;
  zonaId: string;
  letra: string;
  nombre: string;
  imagen?: string;
};

export type PredioOption = {
  id: string;
  cuadranteId: string;
  calle: string;
  numeroPuertaTeorico: string;
  padron?: string;
};

export type PredioDetalle = {
  id: string;
  cuadranteId: string;
  calle: string;
  numeroPuertaTeorico: string;
  padron: string;
  manzana: string;
  lote: string;
  referencia?: string;
  nombreCuadrante?: string;
  origen?: 'manual';
};
