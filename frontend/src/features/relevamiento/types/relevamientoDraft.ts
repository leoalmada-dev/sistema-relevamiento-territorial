import type { CierreRelevamientoFormState } from './cierreRelevamiento';
import type { PersonasContactosPorHogarState } from './personaContacto';
import type { ResultadoVisitaFormState } from './resultadoVisita';
import type { RelevamientoSectionId } from './relevamientoFlow';
import type { PredioDetalle } from './territorio';
import type { HogarFormState, ViviendaFormState } from './viviendaHogar';

export type RelevamientoLocalDraft = {
  version: 1;
  savedAt: string;
  currentSectionId: RelevamientoSectionId;
  selectedPredioId: string;
  selectedPredio: PredioDetalle | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  cierre: CierreRelevamientoFormState;
  finalizacionSimulada: boolean;
};

export type LocalDraftStatus =
  | 'SIN_BORRADOR'
  | 'CAMBIOS_PENDIENTES'
  | 'GUARDADO_LOCAL'
  | 'BORRADOR_RECUPERADO'
  | 'ERROR_GUARDAR';

export const localDraftStatusLabel: Record<LocalDraftStatus, string> = {
  SIN_BORRADOR: 'Sin información guardada',
  CAMBIOS_PENDIENTES: 'Cambios pendientes',
  GUARDADO_LOCAL: 'Guardado automáticamente',
  BORRADOR_RECUPERADO: 'Información recuperada',
  ERROR_GUARDAR: 'Error al guardar la información',
};
