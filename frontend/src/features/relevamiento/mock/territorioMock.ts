import type { CuadranteOption, PredioDetalle, PredioOption, ZonaOption } from '../types/territorio';

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
    nombre: 'Cuadrante A',
  },
  {
    id: 'cuadrante-b',
    zonaId: 'zona-1',
    nombre: 'Cuadrante B',
  },
  {
    id: 'cuadrante-c',
    zonaId: 'zona-2',
    nombre: 'Cuadrante C',
  },
  {
    id: 'cuadrante-d',
    zonaId: 'zona-3',
    nombre: 'Cuadrante D',
  },
];

export const prediosMock: PredioOption[] = [
  {
    id: 'predio-001',
    cuadranteId: 'cuadrante-a',
    numeroPuerta: '101',
    descripcion: 'Boix y Merino 101',
  },
  {
    id: 'predio-002',
    cuadranteId: 'cuadrante-a',
    numeroPuerta: '103',
    descripcion: 'Boix y Merino 103',
  },
  {
    id: 'predio-003',
    cuadranteId: 'cuadrante-b',
    numeroPuerta: '205',
    descripcion: 'Pasaje interno 205',
  },
  {
    id: 'predio-004',
    cuadranteId: 'cuadrante-c',
    numeroPuerta: '308',
    descripcion: 'Camino local 308',
  },
  {
    id: 'predio-005',
    cuadranteId: 'cuadrante-d',
    numeroPuerta: '412',
    descripcion: 'Referencia barrial 412',
  },
];

export const prediosDetalleMock: PredioDetalle[] = [
  {
    id: 'predio-001',
    cuadranteId: 'cuadrante-a',
    numeroPuerta: '101',
    descripcion: 'Boix y Merino 101',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '101',
    padron: 'PAD-001',
    manzana: 'MZ-01',
    lote: 'L-01',
  },
  {
    id: 'predio-002',
    cuadranteId: 'cuadrante-a',
    numeroPuerta: '103',
    descripcion: 'Boix y Merino 103',
    calle: 'Boix y Merino',
    numeroPuertaTeorico: '103',
    padron: 'PAD-002',
    manzana: 'MZ-01',
    lote: 'L-02',
  },
  {
    id: 'predio-003',
    cuadranteId: 'cuadrante-b',
    numeroPuerta: '205',
    descripcion: 'Pasaje interno 205',
    calle: 'Pasaje interno',
    numeroPuertaTeorico: '205',
    padron: 'PAD-003',
    manzana: 'MZ-02',
    lote: 'L-05',
  },
  {
    id: 'predio-004',
    cuadranteId: 'cuadrante-c',
    numeroPuerta: '308',
    descripcion: 'Camino local 308',
    calle: 'Camino local',
    numeroPuertaTeorico: '308',
    padron: 'PAD-004',
    manzana: 'MZ-03',
    lote: 'L-08',
  },
  {
    id: 'predio-005',
    cuadranteId: 'cuadrante-d',
    numeroPuerta: '412',
    descripcion: 'Referencia barrial 412',
    calle: 'Referencia barrial',
    numeroPuertaTeorico: '412',
    padron: 'PAD-005',
    manzana: 'MZ-04',
    lote: 'L-12',
  },
];
