import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import { esCorteTemprano } from '../types/resultadoVisita';
import type { RelevamientoSectionId } from '../types/relevamientoFlow';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';
import type {
  BackendBorradorCreatePayload,
  BackendContactoPayload,
  BackendHogarPayload,
  BackendRelevamientoCreatePayload,
  BackendRelevamientoDraftPayload,
  BackendTerritorioPayload,
} from '../types/relevamientoBackend';

export type RelevamientoBackendSnapshot = {
  currentSectionId: RelevamientoSectionId;
  selectedCuadrante: CuadranteOption | null;
  selectedPredioId: string;
  selectedPredio: PredioDetalle | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  cierre: CierreRelevamientoFormState;
  finalizedAtClient: string;
};

const DEFAULT_EMPTY_TEXT = '';
const DEFAULT_BACKEND_RELATION = 'OTRO';
const DEFAULT_BACKEND_VINCULO_BARRIO = 'Sin información declarada';

function asString(value: unknown, fallback = DEFAULT_EMPTY_TEXT) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function parseNumberOrNull(value: string) {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseIntegerOrZero(value: string | number) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const directValue = Number.parseInt(trimmedValue, 10);

  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const firstNumericValue = trimmedValue.match(/\d+/)?.[0];

  if (!firstNumericValue) {
    return 0;
  }

  const parsedValue = Number.parseInt(firstNumericValue, 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function parseNumericId(value: string | number | undefined | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toBackendSectionId(sectionId: RelevamientoSectionId) {
  return sectionId.replace(/-/g, '_');
}

function toBackendSexo(value: string) {
  const normalizedValue = value.trim();

  const values: Record<string, string> = {
    VARON: 'VARÓN',
    VARÓN: 'VARÓN',
    MUJER: 'MUJER',
    MUJER_TRANS: 'MUJER TRANS',
    'MUJER TRANS': 'MUJER TRANS',
    VARON_TRANS: 'VARÓN TRANS',
    'VARÓN TRANS': 'VARÓN TRANS',
    OTRA: 'OTRA',
    NO_SABE_NO_RESPONDE: 'NO SABE / NO RESPONDE',
    'NO SABE / NO RESPONDE': 'NO SABE / NO RESPONDE',
  };

  return values[normalizedValue] ?? normalizedValue;
}

function buildBackendTerritorio(snapshot: RelevamientoBackendSnapshot): BackendTerritorioPayload {
  const { selectedCuadrante, selectedPredio, selectedPredioId } = snapshot;
  const isManualPredio = selectedPredio?.origen === 'manual';

  const cuadranteId = parseNumericId(selectedCuadrante?.id ?? selectedPredio?.cuadranteId);
  const zonaId = parseNumericId(selectedCuadrante?.zonaId);
  const predioId = isManualPredio ? null : parseNumericId(selectedPredioId || selectedPredio?.id);

  const territorio: BackendTerritorioPayload = {
    zona_id: zonaId,
    cuadrante_id: cuadranteId,
    predio_id: predioId,
  };

  if (selectedPredio) {
    territorio.predio = {
      id: predioId ?? selectedPredio.id,
      calle: selectedPredio.calle,
      numero_teorico_puerta: selectedPredio.numeroPuertaTeorico,
      padron: selectedPredio.padron,
      manzana: selectedPredio.manzana,
      lote: selectedPredio.lote,
    };
  }

  if (isManualPredio && selectedPredio) {
    territorio.predio_manual = {
      origen: 'manual',
      cuadrante_id: cuadranteId,
      calle: selectedPredio.calle,
      numero_puerta_teorico: selectedPredio.numeroPuertaTeorico,
      referencia: selectedPredio.referencia ?? '',
    };
  }

  return territorio;
}

function buildBackendVisita(resultadoVisita: ResultadoVisitaFormState) {
  return {
    resultado: resultadoVisita.resultado,
    motivo_negativa: resultadoVisita.motivoNegativa,
    referencia_no_encontrado: resultadoVisita.referencia,
    contacto_no_encontrado: resultadoVisita.contacto,
    horario_no_encontrado: resultadoVisita.horario,
    observacion_no_encontrado: resultadoVisita.observacion,
  };
}

function buildBackendContactos(contactos: PersonasContactosPorHogarState[string]['contactos']) {
  return contactos.map<BackendContactoPayload>((contacto) => ({
    temp_id: contacto.id,
    orden: parseIntegerOrZero(contacto.orden),
    telefono: contacto.telefono,
    nombre_referencia: contacto.nombreReferencia,
    observaciones: contacto.observaciones,
  }));
}

function buildBackendHogares(snapshot: RelevamientoBackendSnapshot) {
  return snapshot.hogares.map<BackendHogarPayload>((hogar) => {
    const hogarDetalle = snapshot.personasContactosPorHogar[hogar.id];
    const personas = hogarDetalle?.personas ?? [];
    const contactos = hogarDetalle?.contactos ?? [];
    const servicios = hogarDetalle?.servicios;
    const salud = hogarDetalle?.salud;

    return {
      temp_id: hogar.id,
      numero_hogar: parseIntegerOrZero(hogar.numeroHogar),
      tiempo_vive_barrio: parseIntegerOrZero(hogar.tiempoViveBarrio),
      beneficiario_regularizacion: hogar.beneficiarioRegularizacion,
      forma_acceso_vivienda: hogar.formaAccesoVivienda,
      forma_acceso_otro: hogar.formaAccesoOtro,
      titular_vivienda: hogar.titularVivienda,
      conforme_caracteristicas: hogar.conformeCaracteristicas,
      personas: personas.map((persona) => {
        const vinculoBarrio =
          persona.vinculoBarrioFamilia.trim() || DEFAULT_BACKEND_VINCULO_BARRIO;

        return {
          temp_id: persona.id,
          nombre: persona.nombre,
          apellido: persona.apellido,
          documento: asString(persona.cedula),
          edad: parseIntegerOrZero(persona.edad),
          sexo: toBackendSexo(persona.sexo),
          ocupacion: persona.ocupacion,
          es_referente: persona.esReferente,
          parentesco_con_referente:
            persona.parentescoConReferente.trim() || DEFAULT_BACKEND_RELATION,
          vinculo_barrio: vinculoBarrio,
          vinculo_barrio_familia: persona.vinculoBarrioFamilia,
          observaciones: persona.observaciones,
        };
      }),
      contactos: buildBackendContactos(contactos),
      servicios: {
        tiene_luz_agua: servicios?.tieneLuzAgua ?? '',
        tiene_convenio_luz_agua: servicios?.tieneConvenioLuzAgua ?? '',
        titular_convenio_luz_agua: servicios?.titularConvenioLuzAgua ?? '',
        tiene_cable_internet: servicios?.tieneCableInternet ?? '',
        titular_cable_internet: servicios?.titularCableInternet ?? '',
        observaciones: servicios?.observacionesServicios ?? '',
      },
      salud: {
        servicio_atencion_medica: salud?.servicioAtencionMedica ?? '',
        prestador_privado: salud?.prestadorPrivado ?? '',
        centro_asse: salud?.centroASSE ?? '',
        tiene_emergencia_movil: salud?.tieneEmergenciaMovil ?? '',
        emergencia_movil: salud?.emergenciaMovil ?? '',
        observaciones: salud?.observacionesSalud ?? '',
      },
      observaciones: '',
    };
  });
}

export function buildBackendRelevamientoDraft(
  snapshot: RelevamientoBackendSnapshot,
): BackendRelevamientoDraftPayload {
  const isCorteTemprano = esCorteTemprano(snapshot.resultadoVisita.resultado);

  return {
    territorio: buildBackendTerritorio(snapshot),
    visita: buildBackendVisita(snapshot.resultadoVisita),
    vivienda: isCorteTemprano
      ? null
      : {
          cantidad_hogares_declarada: parseIntegerOrZero(
            snapshot.vivienda.cantidadHogaresDeclarada,
          ),
          vinculo_entre_hogares: snapshot.vivienda.vinculoEntreHogares,
          observaciones: snapshot.vivienda.observacionesVivienda,
        },
    hogares: isCorteTemprano ? [] : buildBackendHogares(snapshot),
    observaciones_generales: snapshot.cierre.observacionesGenerales,
    coordenadas: {
      latitud: parseNumberOrNull(snapshot.cierre.latitud),
      longitud: parseNumberOrNull(snapshot.cierre.longitud),
      hora_captura: snapshot.cierre.horaCaptura,
    },
  };
}

export function buildBackendBorradorCreatePayload(
  snapshot: RelevamientoBackendSnapshot,
): BackendBorradorCreatePayload {
  return {
    draft_version: 1,
    current_section: toBackendSectionId(snapshot.currentSectionId),
    finalized_at_client: snapshot.finalizedAtClient,
    draft: buildBackendRelevamientoDraft(snapshot),
  };
}

export function buildBackendRelevamientoCreatePayload(
  borradorId: number,
  borradorPayload: BackendBorradorCreatePayload,
): BackendRelevamientoCreatePayload {
  return {
    draft_version: borradorPayload.draft_version,
    current_section: borradorPayload.current_section,
    finalized_at_client: borradorPayload.finalized_at_client,
    draft: {
      id: borradorId,
    },
  };
}
