import type {
  CuadranteOption,
  PredioDetalle,
  PredioOption,
  ZonaOption,
} from '../types/territorio';

export const zonasMock: ZonaOption[] = [
  {
    id: 'zona-1',
    nombre: 'Zona 1',
  },
  {
    id: 'zona-2',
    nombre: 'Zona 2',
  },
  {
    id: 'zona-3',
    nombre: 'Zona 3',
  },
];

export const cuadrantesMock: CuadranteOption[] = [
  {
    id: 'cuadrante-a',
    zonaId: 'zona-1',
    letra: 'A',
    nombre: 'Cuadrante A',
  },
  {
    id: 'cuadrante-b',
    zonaId: 'zona-1',
    letra: 'B',
    nombre: 'Cuadrante B',
  },
  {
    id: 'cuadrante-c',
    zonaId: 'zona-2',
    letra: 'C',
    nombre: 'Cuadrante C',
  },
  {
    id: 'cuadrante-d',
    zonaId: 'zona-3',
    letra: 'D',
    nombre: 'Cuadrante D',
  },
];

export const prediosMock: PredioOption[] = [
  {
    id: 'predio-1',
    cuadranteId: 'cuadrante-a',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '101',
    padron: '1001',
  },
  {
    id: 'predio-2',
    cuadranteId: 'cuadrante-a',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '103',
    padron: '1002',
  },
  {
    id: 'predio-3',
    cuadranteId: 'cuadrante-b',
    calle: 'Pasaje interno',
    numeroPuertaTeorico: '205',
    padron: '1003',
  },
  {
    id: 'predio-4',
    cuadranteId: 'cuadrante-c',
    calle: 'Camino local',
    numeroPuertaTeorico: '308',
    padron: '1004',
  },
  {
    id: 'predio-5',
    cuadranteId: 'cuadrante-d',
    calle: 'Referencia barrial',
    numeroPuertaTeorico: '412',
    padron: '1005',
  },
];

export const prediosDetalleMock: PredioDetalle[] = [
  {
    id: 'predio-1',
    cuadranteId: 'cuadrante-a',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '101',
    padron: '1001',
    manzana: '10',
    lote: '1',
    referencia: 'Predio mock para desarrollo sin red interna.',
    nombreCuadrante: 'Cuadrante A',
  },
  {
    id: 'predio-2',
    cuadranteId: 'cuadrante-a',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '103',
    padron: '1002',
    manzana: '10',
    lote: '2',
    referencia: 'Predio mock para desarrollo sin red interna.',
    nombreCuadrante: 'Cuadrante A',
  },
  {
    id: 'predio-3',
    cuadranteId: 'cuadrante-b',
    calle: 'Pasaje interno',
    numeroPuertaTeorico: '205',
    padron: '1003',
    manzana: '11',
    lote: '3',
    referencia: 'Predio mock para desarrollo sin red interna.',
    nombreCuadrante: 'Cuadrante B',
  },
  {
    id: 'predio-4',
    cuadranteId: 'cuadrante-c',
    calle: 'Camino local',
    numeroPuertaTeorico: '308',
    padron: '1004',
    manzana: '12',
    lote: '4',
    referencia: 'Predio mock para desarrollo sin red interna.',
    nombreCuadrante: 'Cuadrante C',
  },
  {
    id: 'predio-5',
    cuadranteId: 'cuadrante-d',
    calle: 'Referencia barrial',
    numeroPuertaTeorico: '412',
    padron: '1005',
    manzana: '13',
    lote: '5',
    referencia: 'Predio mock para desarrollo sin red interna.',
    nombreCuadrante: 'Cuadrante D',
  },
];
