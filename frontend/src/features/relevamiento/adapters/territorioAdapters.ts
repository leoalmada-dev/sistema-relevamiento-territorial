import type {
  CuadranteOption,
  PredioDetalle,
  PredioOption,
  ZonaOption,
} from '../types/territorio';

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function pick(record: ApiRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && String(value) !== '') {
      return asString(value);
    }
  }

  return fallback;
}

export function unwrapApiCollection(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const collectionKeys = ['data', 'datos', 'results', 'items', 'zonas', 'cuadrantes', 'predios'];

  for (const key of collectionKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  const objectKeys = ['data', 'datos', 'result', 'item', 'zona', 'cuadrante', 'predio'];

  for (const key of objectKeys) {
    const value = payload[key];

    if (isRecord(value)) {
      return [value];
    }
  }

  return [payload];
}

export function adaptZonaFromApi(record: ApiRecord): ZonaOption {
  const id = pick(record, ['id', 'zona_id', 'id_zona', 'codigo', 'value']);
  const nombre = pick(record, ['nombre', 'name', 'descripcion', 'zona', 'label'], `Zona ${id}`);

  return {
    id,
    nombre,
  };
}

export function adaptCuadranteFromApi(record: ApiRecord, fallbackZonaId = ''): CuadranteOption {
  const id = pick(record, ['id', 'cuadrante_id', 'id_cuadrante', 'codigo', 'value']);
  const zonaId = pick(record, ['zona_id', 'id_zona', 'zonaId'], fallbackZonaId);
  const nombre = pick(record, ['nombre', 'name', 'descripcion', 'label'], `Cuadrante ${id}`);
  const letra = pick(record, ['letra', 'codigo'], nombre || id);
  const imagen = pick(record, ['img', 'imagen', 'image']);

  return {
    id,
    zonaId,
    letra,
    nombre,
    imagen: imagen || undefined,
  };
}

export function adaptPredioOptionFromApi(
  record: ApiRecord,
  fallbackCuadranteId = '',
): PredioOption {
  const id = pick(record, ['id', 'predio_id', 'id_predio', 'codigo', 'value']);
  const cuadranteId = pick(record, ['cuadrante_id', 'id_cuadrante', 'cuadranteId'], fallbackCuadranteId);
  const calle = pick(record, ['calle', 'nombre_calle', 'direccion', 'dir_calle'], 'Sin calle');
  const numeroPuertaTeorico = pick(
    record,
    ['nro_puerta', 'numero_puerta_teorico', 'numeroPuertaTeorico', 'numero', 'puerta', 'nro'],
    'Sin número',
  );
  const padron = pick(record, ['padron', 'padrón', 'nro_padron', 'numero_padron']);

  return {
    id,
    cuadranteId,
    calle,
    numeroPuertaTeorico,
    padron,
  };
}

export function adaptPredioDetalleFromApi(record: ApiRecord): PredioDetalle {
  const option = adaptPredioOptionFromApi(record);

  return {
    ...option,
    padron: option.padron ?? pick(record, ['padron', 'padrón', 'nro_padron', 'numero_padron']),
    manzana: pick(record, ['manzana', 'mz', 'nro_manzana']),
    lote: pick(record, ['lote', 'solar', 'nro_lote']),
    referencia: pick(record, ['obs', 'referencia', 'observacion', 'observaciones', 'descripcion']),
    nombreCuadrante: pick(record, ['nombre_cuadrante', 'cuadrante_nombre', 'cuadrante']),
  };
}

export function adaptZonasFromApi(payload: unknown): ZonaOption[] {
  return unwrapApiCollection(payload).map(adaptZonaFromApi).filter((zona) => zona.id);
}

export function adaptCuadrantesFromApi(payload: unknown, zonaId: string): CuadranteOption[] {
  return unwrapApiCollection(payload)
    .map((record) => adaptCuadranteFromApi(record, zonaId))
    .filter((cuadrante) => cuadrante.id);
}

export function adaptPrediosFromApi(payload: unknown, cuadranteId: string): PredioOption[] {
  return unwrapApiCollection(payload)
    .map((record) => adaptPredioOptionFromApi(record, cuadranteId))
    .filter((predio) => predio.id);
}

export function adaptPredioDetallePayloadFromApi(payload: unknown): PredioDetalle | null {
  const [record] = unwrapApiCollection(payload);

  if (!record) {
    return null;
  }

  const predio = adaptPredioDetalleFromApi(record);

  return predio.id ? predio : null;
}
