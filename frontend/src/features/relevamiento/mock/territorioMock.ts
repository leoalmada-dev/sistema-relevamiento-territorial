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
    imagen: '/zona1/cuadranteA.webp',
  },
  {
    id: 'cuadrante-abis',
    zonaId: 'zona-1',
    letra: 'Abis',
    nombre: 'Cuadrante Abis',
    imagen: '/zona1/cuadranteAbis.webp',
  },
  {
    id: 'cuadrante-b',
    zonaId: 'zona-1',
    letra: 'B',
    nombre: 'Cuadrante B',
    imagen: '/zona1/cuadranteB.webp',
  },
  {
    id: 'cuadrante-c',
    zonaId: 'zona-1',
    letra: 'C',
    nombre: 'Cuadrante C',
    imagen: '/zona1/cuadranteC.webp',
  },
  {
    id: 'cuadrante-cbis',
    zonaId: 'zona-1',
    letra: 'Cbis',
    nombre: 'Cuadrante Cbis',
    imagen: '/zona1/cuadranteCbis.webp',
  },
  {
    id: 'cuadrante-d',
    zonaId: 'zona-1',
    letra: 'D',
    nombre: 'Cuadrante D',
    imagen: '/zona1/cuadranteD.webp',
  },
  {
    id: 'cuadrante-e',
    zonaId: 'zona-1',
    letra: 'E',
    nombre: 'Cuadrante E',
    imagen: '/zona1/cuadranteE.webp',
  },
  {
    id: 'cuadrante-f',
    zonaId: 'zona-1',
    letra: 'F',
    nombre: 'Cuadrante F',
    imagen: '/zona1/cuadranteF.webp',
  },
  {
    id: 'cuadrante-t',
    zonaId: 'zona-1',
    letra: 'T',
    nombre: 'Cuadrante T',
    imagen: '/zona1/cuadranteT.webp',
  },
  {
    id: 'cuadrante-u',
    zonaId: 'zona-1',
    letra: 'U',
    nombre: 'Cuadrante U',
    imagen: '/zona1/cuadranteU.webp',
  },
  {
    id: 'cuadrante-v',
    zonaId: 'zona-1',
    letra: 'V',
    nombre: 'Cuadrante V',
    imagen: '/zona1/cuadranteV.webp',
  },
];

type PredioMockBase = {
  id: string;
  cuadranteId: string;
  calle: string;
  numeroPuertaTeorico: string;
  padron: string;
  manzana: string;
  lote: string;
  referencia: string;
  nombreCuadrante: string;
};

type PredioMockSinId = Omit<PredioMockBase, 'id'>;

type PredioEntrada = {
  cuadranteId: string;
  nombreCuadrante: string;
  calle: string;
  numeros: string[];
};

type PredioIndefinidoMock = {
  calle: string;
  numeroPuertaTeorico: string;
  cuadrantesPosibles: string[];
  motivo: string;
};

const crearPredios = ({
  cuadranteId,
  nombreCuadrante,
  calle,
  numeros,
}: PredioEntrada): PredioMockSinId[] =>
  numeros.map((numeroPuertaTeorico) => ({
    cuadranteId,
    calle,
    numeroPuertaTeorico,
    padron: '0',
    manzana: '0',
    lote: '0',
    referencia: 'sin obs',
    nombreCuadrante,
  }));

const prediosBaseSinIdMock: PredioMockSinId[] = [
  ...crearPredios({
    cuadranteId: 'cuadrante-a',
    nombreCuadrante: 'Cuadrante A',
    calle: 'Arq Emilio Boix y Merino',
    numeros: ['2206', '2306', '2302'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-a',
    nombreCuadrante: 'Cuadrante A',
    calle: 'Espronceda',
    numeros: [
      '1988',
      '1984',
      '1980',
      '1976',
      '1972',
      '1964',
      '1956',
      '1950',
      '1946',
      '1944',
      '1942',
      '1938',
      '1934',
      '1928',
    ],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-abis',
    nombreCuadrante: 'Cuadrante Abis',
    calle: 'Espronceda',
    numeros: ['1924', '1920', '1916', '1908'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-abis',
    nombreCuadrante: 'Cuadrante Abis',
    calle: 'Psje Bañado',
    numeros: ['2273', '2265'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-b',
    nombreCuadrante: 'Cuadrante B',
    calle: 'Psje Bañado',
    numeros: ['2274', '2270', '2266', '2262', '2258', '2254'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-c',
    nombreCuadrante: 'Cuadrante C',
    calle: 'Arq Emilio Boix y Merino',
    numeros: [
      '2282',
      '2276',
      '1938',
      '2272',
      '2268',
      '2264',
      '2260',
      '2256',
      '2252',
    ],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-c',
    nombreCuadrante: 'Cuadrante C',
    calle: 'Psje A',
    numeros: ['2273', '2267', '2263', '2259', '2255'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-cbis',
    nombreCuadrante: 'Cuadrante Cbis',
    calle: 'Menorca',
    numeros: ['1961', '1957', '1956', '1946', '1942'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-cbis',
    nombreCuadrante: 'Cuadrante Cbis',
    calle: 'Psje B',
    numeros: ['1932', '1927', '1924', '1921', '1918', '1915', '1912'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-d',
    nombreCuadrante: 'Cuadrante D',
    calle: 'Psje A',
    numeros: ['2274', '2270'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-d',
    nombreCuadrante: 'Cuadrante D',
    calle: 'Psje B',
    numeros: ['1906'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-e',
    nombreCuadrante: 'Cuadrante E',
    calle: 'Psje A',
    numeros: ['2258'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-e',
    nombreCuadrante: 'Cuadrante E',
    calle: 'Psje B',
    numeros: ['1933'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-e',
    nombreCuadrante: 'Cuadrante E',
    calle: 'Menorca',
    numeros: ['1936', '1930', '1926', '1920', '1914', '1908'],
  }),

  ...crearPredios({
    cuadranteId: 'cuadrante-f',
    nombreCuadrante: 'Cuadrante F',
    calle: 'Calle 2',
    numeros: ['2244', '2240', '2236'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-f',
    nombreCuadrante: 'Cuadrante F',
    calle: 'Calle 4',
    numeros: ['2247', '2243', '2239'],
  }),
  ...crearPredios({
    cuadranteId: 'cuadrante-f',
    nombreCuadrante: 'Cuadrante F',
    calle: 'Menorca',
    numeros: ['1888', '1880'],
  }),
];

export const prediosIndefinidosMock: PredioIndefinidoMock[] = [
  {
    calle: 'Psje B',
    numeroPuertaTeorico: '1938',
    cuadrantesPosibles: ['cuadrante-cbis', 'cuadrante-d'],
    motivo:
      'Aparece en zona de lectura compartida entre Cbis y D. Falta confirmar si corresponde cargarlo en Cbis o D.',
  },
  {
    calle: 'Psje B',
    numeroPuertaTeorico: '1933',
    cuadrantesPosibles: ['cuadrante-cbis', 'cuadrante-e'],
    motivo:
      'Aparece asociado a E en la nueva captura, pero estaba previamente en Cbis. Se cargó en E y queda registrado para revisión.',
  },
  {
    calle: 'Calle 2',
    numeroPuertaTeorico: '2244',
    cuadrantesPosibles: ['cuadrante-e', 'cuadrante-f'],
    motivo:
      'Aparece en borde entre E y F. Se cargó en F por referencia del archivo, pero conviene revisar si corresponde a E.',
  },
  {
    calle: 'Calle 2',
    numeroPuertaTeorico: '2240',
    cuadrantesPosibles: ['cuadrante-e', 'cuadrante-f'],
    motivo:
      'Aparece en borde entre E y F. Se cargó en F por referencia del archivo, pero conviene revisar si corresponde a E.',
  },
  {
    calle: 'Calle 2',
    numeroPuertaTeorico: '2236',
    cuadrantesPosibles: ['cuadrante-e', 'cuadrante-f'],
    motivo:
      'Aparece en borde entre E y F. Se cargó en F por referencia del archivo, pero conviene revisar si corresponde a E.',
  },
];

const prediosBaseMock: PredioMockBase[] = prediosBaseSinIdMock.map(
  (predio, index) => ({
    id: `predio-${index + 1}`,
    ...predio,
  }),
);

export const prediosMock: PredioOption[] = prediosBaseMock.map(
  ({ id, cuadranteId, calle, numeroPuertaTeorico, padron }) => ({
    id,
    cuadranteId,
    calle,
    numeroPuertaTeorico,
    padron,
  }),
);

export const prediosDetalleMock: PredioDetalle[] = prediosBaseMock.map(
  ({
    id,
    cuadranteId,
    calle,
    numeroPuertaTeorico,
    padron,
    manzana,
    lote,
    referencia,
    nombreCuadrante,
  }) => ({
    id,
    cuadranteId,
    calle,
    numeroPuertaTeorico,
    padron,
    manzana,
    lote,
    referencia,
    nombreCuadrante,
  }),
);