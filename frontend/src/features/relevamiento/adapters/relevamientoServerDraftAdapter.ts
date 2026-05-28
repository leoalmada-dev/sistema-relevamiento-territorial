import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type {
  ContactoFormState,
  PersonasContactosHogarState,
  PersonasContactosPorHogarState,
  PersonaFormState,
} from '../types/personaContacto';
import type { ResultadoVisita, ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { RelevamientoSectionId } from '../types/relevamientoFlow';
import type {
  BackendBorradorServidorItem,
  BackendBorradorServidorDraftData,
} from '../types/relevamientoBackend';
import type { RelevamientoLocalDraft } from '../types/relevamientoDraft';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import type { EstadoHogarMvp, HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

type UnknownRecord = Record<string, unknown>;

const sectionIdMap: Record<string, RelevamientoSectionId> = {
  inicio_predio_visita: 'inicio-predio-visita',
  vivienda_hogares: 'vivienda-hogares',
  datos_por_hogar: 'datos-por-hogar',
  cierre_finalizacion: 'cierre-finalizacion',
};

const resultadoVisitaValues: ResultadoVisita[] = [
  '',
  'ENTREVISTA_REALIZADA',
  'SE_NIEGA',
  'NO_SE_ENCUENTRA',
];

const estadoHogarValues: EstadoHogarMvp[] = [
  'ENTREVISTADO',
  'PENDIENTE',
  'NO_SE_ENCUENTRA',
  'SE_NIEGA',
];

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeResultadoVisita(value: unknown): ResultadoVisita {
  const stringValue = asString(value) as ResultadoVisita;

  return resultadoVisitaValues.includes(stringValue) ? stringValue : '';
}

function normalizeEstadoHogar(value: unknown): EstadoHogarMvp {
  const stringValue = asString(value) as EstadoHogarMvp;

  return estadoHogarValues.includes(stringValue) ? stringValue : 'ENTREVISTADO';
}

function fromBackendSectionId(value: unknown): RelevamientoSectionId {
  return sectionIdMap[asString(value)] ?? 'inicio-predio-visita';
}

function fromBackendSexo(value: unknown) {
  const stringValue = asString(value);

  const map: Record<string, string> = {
    VARÓN: 'VARON',
    VARON: 'VARON',
    MUJER: 'MUJER',
    'MUJER TRANS': 'MUJER_TRANS',
    MUJER_TRANS: 'MUJER_TRANS',
    'VARÓN TRANS': 'VARON_TRANS',
    VARON_TRANS: 'VARON_TRANS',
    OTRA: 'OTRA',
    'NO SABE / NO RESPONDE': 'NO_SABE_NO_RESPONDE',
    NO_SABE_NO_RESPONDE: 'NO_SABE_NO_RESPONDE',
  };

  return map[stringValue] ?? stringValue;
}

function buildSelectedPredio(
  data: BackendBorradorServidorDraftData,
  predioId: string,
): PredioDetalle | null {
  const territorio = asRecord(data.territorio);
  const predio = asRecord(territorio.predio);

  if (Object.keys(predio).length === 0 && !predioId) {
    return null;
  }

  return {
    id: asString(predio.id || predioId),
    cuadranteId: asString(territorio.cuadrante_id),
    calle: asString(predio.calle),
    numeroPuertaTeorico: asString(
      predio.numero_teorico_puerta || predio.numeroPuertaTeorico || predio.nro_puerta,
    ),
    padron: asString(predio.padron),
    manzana: asString(predio.manzana),
    lote: asString(predio.lote),
    nombreCuadrante: asString(predio.nombre_cuadrante) || undefined,
  };
}

function buildSelectedCuadrante(
  data: BackendBorradorServidorDraftData,
  selectedPredio: PredioDetalle | null,
): CuadranteOption | null {
  const territorio = asRecord(data.territorio);
  const cuadranteId = asString(territorio.cuadrante_id);
  const zonaId = asString(territorio.zona_id);

  if (!cuadranteId || !zonaId) {
    return null;
  }

  return {
    id: cuadranteId,
    zonaId,
    letra: cuadranteId,
    nombre: selectedPredio?.nombreCuadrante || `Cuadrante ${cuadranteId}`,
  };
}

function buildResultadoVisita(data: BackendBorradorServidorDraftData): ResultadoVisitaFormState {
  const visita = asRecord(data.visita);

  return {
    resultado: normalizeResultadoVisita(visita.resultado),
    motivoNegativa: asString(visita.motivo_negativa),
    referencia: asString(visita.referencia_no_encontrado),
    contacto: asString(visita.contacto_no_encontrado),
    horario: asString(visita.horario_no_encontrado),
    observacion: asString(visita.observacion_no_encontrado),
  };
}

function buildVivienda(data: BackendBorradorServidorDraftData): ViviendaFormState {
  const vivienda = asRecord(data.vivienda);

  return {
    cantidadHogaresDeclarada: asString(vivienda.cantidad_hogares_declarada),
    vinculoEntreHogares: asString(vivienda.vinculo_entre_hogares),
    observacionesVivienda: asString(vivienda.observaciones),
  };
}

function buildPersona(value: unknown, index: number): PersonaFormState {
  const persona = asRecord(value);

  return {
    id: asString(persona.temp_id) || `persona-servidor-${index + 1}`,
    nombre: asString(persona.nombre),
    apellido: asString(persona.apellido),
    cedula: asString(persona.documento),
    edad: asString(persona.edad),
    sexo: fromBackendSexo(persona.sexo),
    ascendenciaEtnicoRacial: asString(
      persona.ascendencia_etnico_racial || persona.ascendenciaEtnicoRacial,
    ),
    ocupacion: asString(persona.ocupacion),
    presentaDiscapacidad: asString(
      persona.presenta_discapacidad || persona.presentaDiscapacidad,
    ),
    tipoDiscapacidad: asString(persona.tipo_discapacidad || persona.tipoDiscapacidad),
    esReferente: Boolean(persona.es_referente),
    parentescoConReferente: asString(persona.parentesco_con_referente),
    vinculoBarrioFamilia: asString(persona.vinculo_barrio_familia || persona.vinculo_barrio),
    observaciones: asString(persona.observaciones),
  };
}

function buildContacto(value: unknown, index: number): ContactoFormState {
  const contacto = asRecord(value);

  return {
    id: asString(contacto.temp_id) || `contacto-servidor-${index + 1}`,
    orden: asString(contacto.orden || index + 1),
    telefono: asString(contacto.telefono),
    nombreReferencia: asString(contacto.nombre_referencia),
    observaciones: asString(contacto.observaciones),
  };
}

function buildPersonasContactosHogar(hogar: UnknownRecord): PersonasContactosHogarState {
  const servicios = asRecord(hogar.servicios);
  const salud = asRecord(hogar.salud);

  return {
    personas: asArray(hogar.personas).map(buildPersona),
    contactos: asArray(hogar.contactos).map(buildContacto),
    servicios: {
      tieneLuzAgua: asString(servicios.tiene_luz_agua),
      tieneConvenioLuzAgua: asString(servicios.tiene_convenio_luz_agua),
      titularConvenioLuzAgua: asString(servicios.titular_convenio_luz_agua),
      tieneCableInternet: asString(servicios.tiene_cable_internet),
      titularCableInternet: asString(servicios.titular_cable_internet),
      observacionesServicios: asString(servicios.observaciones),
    },
    salud: {
      servicioAtencionMedica: asString(salud.servicio_atencion_medica),
      prestadorPrivado: asString(salud.prestador_privado),
      centroASSE: asString(salud.centro_asse),
      tieneEmergenciaMovil: asString(salud.tiene_emergencia_movil),
      emergenciaMovil: asString(salud.emergencia_movil),
      observacionesSalud: asString(salud.observaciones),
    },
  };
}

function buildHogares(data: BackendBorradorServidorDraftData) {
  const personasContactosPorHogar: PersonasContactosPorHogarState = {};

  const hogares: HogarFormState[] = asArray(data.hogares).map((value, index) => {
    const hogar = asRecord(value);
    const hogarId = asString(hogar.temp_id) || `hogar-servidor-${index + 1}`;

    personasContactosPorHogar[hogarId] = buildPersonasContactosHogar(hogar);

    return {
      id: hogarId,
      numeroHogar: asString(hogar.numero_hogar || index + 1),
      estadoHogar: normalizeEstadoHogar(
        hogar.estado_hogar || hogar.estadoHogar || hogar.estado,
      ),
      observacionEstadoHogar: asString(
        hogar.observacion_estado_hogar || hogar.observacionEstadoHogar,
      ),
      tiempoViveBarrio: asString(hogar.tiempo_vive_barrio),
      beneficiarioRegularizacion: asString(hogar.beneficiario_regularizacion),
      formaAccesoVivienda: asString(hogar.forma_acceso_vivienda),
      formaAccesoOtro: asString(hogar.forma_acceso_otro),
      titularVivienda: asString(hogar.titular_vivienda),
      conformeCaracteristicas: asString(hogar.conforme_caracteristicas),
    };
  });

  return {
    hogares,
    personasContactosPorHogar,
  };
}

function buildCierre(data: BackendBorradorServidorDraftData): CierreRelevamientoFormState {
  const coordenadas = asRecord(data.coordenadas);

  return {
    observacionesGenerales: asString(data.observaciones_generales),
    latitud: asString(coordenadas.latitud),
    longitud: asString(coordenadas.longitud),
    horaCaptura: asString(coordenadas.hora_captura),
  };
}

export function buildLocalDraftFromServerDraft(
  item: BackendBorradorServidorItem,
): RelevamientoLocalDraft {
  const data = asRecord(item.datos) as BackendBorradorServidorDraftData;
  const territorio = asRecord(data.territorio);
  const predioId = asString(item.predio_id || territorio.predio_id);
  const selectedPredio = buildSelectedPredio(data, predioId);
  const { hogares, personasContactosPorHogar } = buildHogares(data);
  const savedAt = asString(item.updated_at || item.created_at) || new Date().toISOString();

  return {
    version: 1,
    savedAt,
    currentSectionId: fromBackendSectionId(item.current_section),
    selectedPredioId: predioId,
    selectedPredio,
    selectedCuadrante: buildSelectedCuadrante(data, selectedPredio),
    resultadoVisita: buildResultadoVisita(data),
    vivienda: buildVivienda(data),
    hogares,
    personasContactosPorHogar,
    cierre: buildCierre(data),
    finalizacionSimulada: false,
    serverDraftId: asNumber(item.id),
    serverDraftVersion: asNumber(item.draft_version),
    serverDraftLastSyncedAt: savedAt,
    serverDraftSyncStatus: 'SINCRONIZADO',
    serverDraftSyncError: '',
  };
}
