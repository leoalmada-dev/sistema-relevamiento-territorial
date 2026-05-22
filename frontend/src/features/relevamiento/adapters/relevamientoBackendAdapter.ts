import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import { esCorteTemprano } from '../types/resultadoVisita';
import type { RelevamientoSectionId } from '../types/relevamientoFlow';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';
import type {
  BackendBorradorCreatePayload,
  BackendBorradorSyncPayload,
  BackendRelevamientoCreatePayload,
  BackendRelevamientoDraftPayload,
  BackendTerritorioPayload,
} from '../types/relevamientoBackend';

const DEFAULT_EMPTY_TEXT = '';

export type RelevamientoBackendSnapshot = {
  currentSectionId: RelevamientoSectionId;
  selectedPredioId: string;
  selectedPredio: PredioDetalle | null;
  selectedCuadrante: CuadranteOption | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  cierre: CierreRelevamientoFormState;
};

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

  const parsedValue = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function parseNumericId(value: string | number | undefined | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(String(value), 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toBackendSectionId(sectionId: RelevamientoSectionId) {
  return sectionId.replace(/-/g, '_');
}

function toBackendSexo(value: string) {
  const normalizedValue = value.trim();

  const map: Record<string, string> = {
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

  return map[normalizedValue] ?? normalizedValue;
}

function buildBackendTerritorio(snapshot: RelevamientoBackendSnapshot): BackendTerritorioPayload {
  const predio = snapshot.selectedPredio;
  const cuadranteId = parseNumericId(predio?.cuadranteId ?? snapshot.selectedCuadrante?.id);
  const zonaId = parseNumericId(snapshot.selectedCuadrante?.zonaId);
  const predioId = parseNumericId(predio?.id ?? snapshot.selectedPredioId);

  const territorio: BackendTerritorioPayload = {
    zona_id: zonaId,
    cuadrante_id: cuadranteId,
    predio_id: predio?.origen === 'manual' ? null : predioId,
  };

  if (!predio) {
    return territorio;
  }

  if (predio.origen === 'manual') {
    territorio.predio_manual = {
      origen: 'manual',
      cuadrante_id: cuadranteId,
      calle: predio.calle,
      numero_puerta_teorico: predio.numeroPuertaTeorico,
      referencia: predio.referencia ?? '',
    };

    return territorio;
  }

  territorio.predio = {
    id: predio.id,
    calle: predio.calle,
    numero_teorico_puerta: predio.numeroPuertaTeorico,
    padron: predio.padron,
    manzana: predio.manzana,
    lote: predio.lote,
  };

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
  return contactos.map((contacto) => ({
    temp_id: contacto.id,
    orden: parseIntegerOrZero(contacto.orden),
    telefono: contacto.telefono,
    nombre_referencia: contacto.nombreReferencia,
    observaciones: contacto.observaciones,
  }));
}

function buildBackendHogares(snapshot: RelevamientoBackendSnapshot) {
  if (esCorteTemprano(snapshot.resultadoVisita.resultado)) {
    return [];
  }

  return snapshot.hogares.map((hogar) => {
    const personasContactos = snapshot.personasContactosPorHogar[hogar.id];
    const personas = personasContactos?.personas ?? [];
    const contactos = personasContactos?.contactos ?? [];

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
        const vinculoBarrio = asString(
          persona.vinculoBarrioFamilia,
          'Sin información declarada',
        );

        return {
          temp_id: persona.id,
          nombre: persona.nombre,
          apellido: persona.apellido,
          documento: asString(persona.cedula),
          edad: parseIntegerOrZero(persona.edad),
          sexo: toBackendSexo(persona.sexo),
          ocupacion: persona.ocupacion,
          es_referente: persona.esReferente,
          parentesco_con_referente: asString(persona.parentescoConReferente, 'OTRO'),
          vinculo_barrio: vinculoBarrio,
          vinculo_barrio_familia: persona.vinculoBarrioFamilia,
          observaciones: persona.observaciones,
        };
      }),
      contactos: buildBackendContactos(contactos),
      servicios: {
        tiene_luz_agua: personasContactos?.servicios.tieneLuzAgua ?? '',
        tiene_convenio_luz_agua: personasContactos?.servicios.tieneConvenioLuzAgua ?? '',
        titular_convenio_luz_agua:
          personasContactos?.servicios.titularConvenioLuzAgua ?? '',
        tiene_cable_internet: personasContactos?.servicios.tieneCableInternet ?? '',
        titular_cable_internet: personasContactos?.servicios.titularCableInternet ?? '',
        observaciones: personasContactos?.servicios.observacionesServicios ?? '',
      },
      salud: {
        servicio_atencion_medica: personasContactos?.salud.servicioAtencionMedica ?? '',
        prestador_privado: personasContactos?.salud.prestadorPrivado ?? '',
        centro_asse: personasContactos?.salud.centroASSE ?? '',
        tiene_emergencia_movil: personasContactos?.salud.tieneEmergenciaMovil ?? '',
        emergencia_movil: personasContactos?.salud.emergenciaMovil ?? '',
        observaciones: personasContactos?.salud.observacionesSalud ?? '',
      },
      observaciones: '',
    };
  });
}

export function buildBackendRelevamientoDraft(
  snapshot: RelevamientoBackendSnapshot,
): BackendRelevamientoDraftPayload {
  const vivienda = esCorteTemprano(snapshot.resultadoVisita.resultado)
    ? null
    : {
        cantidad_hogares_declarada: parseIntegerOrZero(
          snapshot.vivienda.cantidadHogaresDeclarada,
        ),
        vinculo_entre_hogares: snapshot.vivienda.vinculoEntreHogares,
        observaciones: snapshot.vivienda.observacionesVivienda,
      };

  return {
    territorio: buildBackendTerritorio(snapshot),
    visita: buildBackendVisita(snapshot.resultadoVisita),
    vivienda,
    hogares: buildBackendHogares(snapshot),
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
    saved_at_client: new Date().toISOString(),
    finalized_at_client: null,
    draft: buildBackendRelevamientoDraft(snapshot),
  };
}

export function buildBackendBorradorSyncPayload(
  snapshot: RelevamientoBackendSnapshot,
  serverDraftId: number,
  draftVersion: number,
): BackendBorradorSyncPayload {
  return {
    id: serverDraftId,
    draft_version: draftVersion,
    current_section: toBackendSectionId(snapshot.currentSectionId),
    saved_at_client: new Date().toISOString(),
    finalized_at_client: null,
    draft: {
      ...buildBackendRelevamientoDraft(snapshot),
      id: serverDraftId,
    },
  };
}

export function buildBackendRelevamientoCreatePayload(
  serverDraftId: number,
  snapshot: RelevamientoBackendSnapshot,
  draftVersion: number,
): BackendRelevamientoCreatePayload {
  return {
    draft_version: draftVersion,
    current_section: toBackendSectionId(snapshot.currentSectionId),
    finalized_at_client: new Date().toISOString(),
    draft: {
      ...buildBackendRelevamientoDraft(snapshot),
      id: serverDraftId,
    },
  };
}
