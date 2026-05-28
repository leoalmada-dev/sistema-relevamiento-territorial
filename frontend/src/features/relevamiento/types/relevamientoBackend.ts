export type BackendFinalizationMode = 'local' | 'backend';

export type BackendApiResponse<T> = {
  code?: number;
  status?: string;
  message?: string;
  datos?: T;
  errors?: unknown;
};

export type BackendBorradorCreateResponseData = {
  id: number;
  current_section?: string;
  draft_version?: number;
  saved_at_client?: string | null;
  completed?: boolean;
  draft?: unknown;
};

export type BackendBorradorGetResponseData = {
  current_section?: string;
  draft_version?: number;
  saved_at_client?: string | null;
  completed?: boolean;
  draft?: unknown;
};

export type BackendBorradorServidorDraftData = Record<string, unknown>;

export type BackendBorradorServidorItem = {
  id: number;
  grupo_id?: number | null;
  datos: BackendBorradorServidorDraftData;
  current_section?: string | null;
  draft_version?: number | null;
  completed?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  predio_id?: number | string | null;
};

export type BackendBorradoresPorPredioResponse =
  BackendApiResponse<BackendBorradorServidorItem[]>;

export type BackendBorradorCreatePayload = {
  draft_version: number;
  current_section: string;
  saved_at_client: string | null;
  finalized_at_client: string | null;
  draft: BackendRelevamientoDraftPayload;
};

export type BackendBorradorSyncPayload = {
  id: number;
  draft_version: number;
  current_section: string;
  saved_at_client: string | null;
  finalized_at_client: string | null;
  draft: BackendRelevamientoDraftPayload & {
    id: number;
  };
};

export type BackendRelevamientoCreatePayload = {
  draft_version: number;
  current_section: string;
  finalized_at_client: string;
  draft: BackendRelevamientoDraftPayload & {
    id: number;
  };
};

export type BackendRelevamientoDraftPayload = {
  id?: number;
  territorio: BackendTerritorioPayload;
  visita: BackendVisitaPayload;
  vivienda: BackendViviendaPayload | null;
  hogares: BackendHogarPayload[];
  observaciones_generales: string;
  coordenadas: BackendCoordenadasPayload;
};

export type BackendTerritorioPayload = {
  zona_id: number | null;
  cuadrante_id: number | null;
  predio_id: number | null;
  predio?: BackendPredioPayload;
  predio_manual?: BackendPredioManualPayload;
};

export type BackendPredioPayload = {
  id: number | string;
  calle: string;
  numero_teorico_puerta: string;
  padron: string;
  manzana: string;
  lote: string;
};

export type BackendPredioManualPayload = {
  origen: 'manual';
  cuadrante_id: number | null;
  calle: string;
  numero_puerta_teorico: string;
  referencia: string;
};

export type BackendVisitaPayload = {
  resultado: string;
  motivo_negativa: string;
  referencia_no_encontrado: string;
  contacto_no_encontrado: string;
  horario_no_encontrado: string;
  observacion_no_encontrado: string;
};

export type BackendViviendaPayload = {
  cantidad_hogares_declarada: number;
  vinculo_entre_hogares: string;
  observaciones: string;
};

export type BackendHogarPayload = {
  temp_id: string;
  numero_hogar: number;
  tiempo_vive_barrio: number;
  beneficiario_regularizacion: string;
  forma_acceso_vivienda: string;
  forma_acceso_otro: string;
  titular_vivienda: string;
  conforme_caracteristicas: string;
  personas: BackendPersonaPayload[];
  contactos: BackendContactoPayload[];
  servicios: BackendServiciosPayload;
  salud: BackendSaludPayload;
  observaciones: string;
  estado_hogar?: string;
  observacion_estado_hogar?: string;
};

export type BackendPersonaPayload = {
  temp_id: string;
  nombre: string;
  apellido: string;
  documento: string;
  edad: number;
  sexo: string;
  ascendencia_etnico_racial: string;
  ocupacion: string;
  presenta_discapacidad: string;
  tipo_discapacidad: string;
  es_referente: boolean;
  parentesco_con_referente: string;
  vinculo_barrio: string;
  vinculo_barrio_familia: string;
  observaciones: string;
};

export type BackendContactoPayload = {
  temp_id: string;
  orden: number;
  telefono: string;
  nombre_referencia: string;
  observaciones: string;
};

export type BackendServiciosPayload = {
  tiene_luz_agua: string;
  tiene_convenio_luz_agua: string;
  titular_convenio_luz_agua: string;
  tiene_cable_internet: string;
  titular_cable_internet: string;
  observaciones: string;
};

export type BackendSaludPayload = {
  servicio_atencion_medica: string;
  prestador_privado: string;
  centro_asse: string;
  tiene_emergencia_movil: string;
  emergencia_movil: string;
  observaciones: string;
};

export type BackendCoordenadasPayload = {
  latitud: number | null;
  longitud: number | null;
  hora_captura: string;
};

export type GuardarBorradorServidorParams = {
  snapshot: import('../adapters/relevamientoBackendAdapter').RelevamientoBackendSnapshot;
  serverDraftId: number | null;
  serverDraftVersion: number | null;
};

export type GuardarBorradorServidorResult = {
  mode: BackendFinalizationMode;
  borradorId: number | null;
  draftVersion: number | null;
  message: string;
};

export type FinalizarRelevamientoBackendResult = {
  mode: BackendFinalizationMode;
  borradorId?: number;
  draftVersion?: number | null;
  message: string;
};
