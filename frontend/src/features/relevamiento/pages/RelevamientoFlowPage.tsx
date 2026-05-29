import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Modal, Row, Stack } from 'react-bootstrap';
import { BorradoresLocalesList } from '../components/BorradoresLocalesList';
import { BorradoresServidorList } from '../components/BorradoresServidorList';
import { CierreRelevamientoSection } from '../components/CierreRelevamientoSection';
import { CuadranteImageModal } from '../components/CuadranteImageModal';
import { PersonasContactosSection } from '../components/PersonasContactosSection';
import { ResultadoVisitaSelector } from '../components/ResultadoVisitaSelector';
import { SectionPlaceholder } from '../components/SectionPlaceholder';
import { SectionStepper } from '../components/SectionStepper';
import { TerritorialSelector } from '../components/TerritorialSelector';
import { ViviendaHogaresSection } from '../components/ViviendaHogaresSection';
import { ConfirmActionModal } from '../../../shared/components/ConfirmActionModal';
import { buildLocalDraftFromServerDraft } from '../adapters/relevamientoServerDraftAdapter';
import {
  buildLocalDraftKey,
  clearLocalDraft,
  LOCAL_DRAFT_STORAGE_KEY,
  findLocalDraftForSelectedPredio,
  getLocalDraft,
  getLocalDraftByKey,
  getLocalDraftPredioDisplayLabel,
  getLocalDraftPredioDoorNumber,
  getLocalDraftsIndex,
  removeLocalDraftByKey,
  saveLocalDraft,
} from '../services/draftStorageService';
import {
  BackendValidationError,
  DOCUMENTO_REGISTRADO_MESSAGE,
  consultarPersonaPorDocumento,
  finalizarRelevamientoBackend,
  getRelevamientoFinalizationMode,
  guardarBorradorServidor,
  isPredioConCargaExistenteError,
  listarBorradoresServidorPendientes,
  listarBorradoresServidorPorPredio,
} from '../services/relevamientoBackendService';
import {
  validateCierreRelevamiento,
  validateFinalizacionRelevamiento,
  validateInicioPredioVisita,
  validatePersonasContactos,
  validateViviendaHogares,
  type FinalizacionValidationError,
  type FinalizacionValidationResult,
} from '../validation/finalizacionValidation';
import {
  cierreRelevamientoInicial,
  type CierreRelevamientoFormState,
} from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { BackendBorradorServidorItem } from '../types/relevamientoBackend';
import {
  localDraftStatusLabel,
  serverDraftSyncStatusLabel,
  type LocalDraftStatus,
  type RelevamientoLocalDraft,
  type RelevamientoLocalDraftIndexItem,
  type ServerDraftSyncStatus,
} from '../types/relevamientoDraft';
import {
  esCorteTemprano,
  permiteContinuarFormulario,
  resultadoVisitaInicial,
  type ResultadoVisitaFormState,
} from '../types/resultadoVisita';
import type { RelevamientoSection, RelevamientoSectionId } from '../types/relevamientoFlow';
import type { CuadranteOption, PredioDetalle } from '../types/territorio';
import {
  crearHogarInicial,
  hayHogaresNoEntrevistados,
  hogarEstaEntrevistado,
  viviendaInicial,
  type HogarFormState,
  type ViviendaFormState,
} from '../types/viviendaHogar';

const MAX_HOGARES_DECLARADOS = 5;

const sections: RelevamientoSection[] = [
  {
    id: 'inicio-predio-visita',
    order: 1,
    title: 'Inicio, predio y resultado de visita',
    description:
      'Inicio del relevamiento. Define si la entrevista continúa o corresponde cerrar la visita.',
    includes: [
      'Selección de zona, cuadrante y predio.',
      'Visualización de datos precargados del predio.',
      'Resultado de visita y continuidad del formulario.',
      'Confirmación inicial antes de completar el resto del formulario.',
    ],
  },
  {
    id: 'vivienda-hogares',
    order: 2,
    title: 'Vivienda y hogares',
    description:
      'Datos generales de vivienda y gestión de hogares dentro del predio.',
    includes: [
      'Cantidad de hogares declarada.',
      'Vínculo entre hogares.',
      'Observaciones de vivienda.',
      'Agregar, editar, listar y eliminar hogares durante la carga.',
    ],
  },
  {
    id: 'datos-por-hogar',
    order: 3,
    title: 'Personas, contactos, servicios y salud por hogar',
    description:
      'Datos de integrantes, contactos, servicios y salud asociados a cada hogar.',
    includes: [
      'Seleccionar hogar cargado en Sección 2.',
      'Agregar, editar, listar y eliminar personas por hogar.',
      'Agregar, editar, listar y eliminar contactos por hogar.',
      'Servicios y salud asociados a cada hogar.',
    ],
  },
  {
    id: 'cierre-finalizacion',
    order: 4,
    title: 'Observaciones, coordenadas y finalización',
    description:
      'Cierre del relevamiento con observaciones generales, ubicación a confirmar y revisión final.',
    includes: [
      'Observaciones generales del relevamiento.',
      'Ubicación a confirmar asociada al relevamiento completo.',
      'Revisión final de la información cargada.',
      'Confirmación de revisión antes del cierre.',
    ],
  },
];

function formatSavedAt(savedAt: string) {
  try {
    return new Intl.DateTimeFormat('es-UY', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(savedAt));
  } catch {
    return savedAt;
  }
}

type FlowConfirmAction =
  | { type: 'discard-local-draft' }
  | { type: 'remove-hogar'; hogarId: string }
  | { type: 'change-territorial-selection'; applyChange: () => void }
  | { type: 'change-resultado-corte-temprano'; nextResultado: ResultadoVisitaFormState }
  | { type: 'finalize-relevamiento' };

type ValidationFocusRequest = {
  campo: string;
  requestId: number;
};

type ValidationFocusTarget = {
  sectionId: RelevamientoSectionId;
  selector: string;
  fallbackSelector?: string;
  hogarIndex?: number;
};

function buildBackendValidationErrors(error: unknown): FinalizacionValidationError[] {
  if (!(error instanceof BackendValidationError)) {
    return [];
  }

  return error.validationErrors.map((validationError) => ({
    campo: validationError.frontendPath,
    mensaje: validationError.message,
  }));
}

function getPredioActualLabel(
  selectedPredio: PredioDetalle | null,
  selectedPredioId: string,
) {
  if (!selectedPredio) {
    return 'sin seleccionar';
  }

  const predioRecord = selectedPredio as unknown as Record<string, unknown>;

  const getTextField = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      const value = predioRecord[fieldName];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return '';
  };

  const direccion = getTextField(['direccion', 'direccionCompleta', 'domicilio']);
  const calle = getTextField(['calle', 'nombreCalle', 'calleNombre']);
  const numeroPuerta = getTextField([
    'numeroPuertaTeorico',
    'numeroPuerta',
    'numero',
    'numeroTeorico',
    'puerta',
    'nroPuerta',
  ]);

  if (direccion) {
    return numeroPuerta && !direccion.includes(numeroPuerta)
      ? `${direccion} ${numeroPuerta}`
      : direccion;
  }

  if (calle || numeroPuerta) {
    return [calle, numeroPuerta].filter(Boolean).join(' ');
  }

  return selectedPredioId || selectedPredio.id || 'sin identificar';
}

function getCuadranteActualLabel(
  selectedCuadrante: CuadranteOption | null,
  selectedPredio: PredioDetalle | null,
) {
  if (selectedCuadrante?.nombre) {
    return selectedCuadrante.nombre;
  }

  if (selectedCuadrante?.id) {
    return selectedCuadrante.id;
  }

  if (!selectedPredio) {
    return 'sin seleccionar';
  }

  const predioRecord = selectedPredio as unknown as Record<string, unknown>;

  for (const fieldName of ['cuadrante', 'cuadranteId', 'idCuadrante']) {
    const value = predioRecord[fieldName];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return 'sin identificar';
}

function formatCurrentTimeForInput(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function RelevamientoFlowPage() {
  const [currentSectionId, setCurrentSectionId] =
    useState<RelevamientoSectionId>('inicio-predio-visita');
  const [selectedPredioId, setSelectedPredioId] = useState('');
  const [selectedPredio, setSelectedPredio] = useState<PredioDetalle | null>(null);
  const [selectedCuadrante, setSelectedCuadrante] = useState<CuadranteOption | null>(null);
  const [showCuadranteImageModal, setShowCuadranteImageModal] = useState(false);
  const [resultadoVisita, setResultadoVisita] =
    useState<ResultadoVisitaFormState>(resultadoVisitaInicial);
  const [vivienda, setVivienda] = useState<ViviendaFormState>(viviendaInicial);
  const [hogares, setHogares] = useState<HogarFormState[]>([]);
  const [personasContactosPorHogar, setPersonasContactosPorHogar] =
    useState<PersonasContactosPorHogarState>({});
  const [cierre, setCierre] =
    useState<CierreRelevamientoFormState>(cierreRelevamientoInicial);
  const [finalizacionCompletada, setFinalizacionCompletada] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationError, setFinalizationError] = useState('');
  const [finalizationValidationErrors, setFinalizationValidationErrors] =
    useState<FinalizacionValidationError[]>([]);
  const [sectionValidationErrors, setSectionValidationErrors] =
    useState<FinalizacionValidationError[]>([]);
  const [validationFocusRequest, setValidationFocusRequest] =
    useState<ValidationFocusRequest | null>(null);
  const [showHogaresPendientesFinalizacionModal, setShowHogaresPendientesFinalizacionModal] =
    useState(false);
  const [showBorradorPendienteGuardadoModal, setShowBorradorPendienteGuardadoModal] =
    useState(false);
  const [serverDraftId, setServerDraftId] = useState<number | null>(null);
  const [serverDraftVersion, setServerDraftVersion] = useState<number | null>(null);
  const [serverDraftLastSyncedAt, setServerDraftLastSyncedAt] = useState('');
  const [serverDraftSyncStatus, setServerDraftSyncStatus] =
    useState<ServerDraftSyncStatus>('SIN_BORRADOR_SERVIDOR');
  const [serverDraftSyncError, setServerDraftSyncError] = useState('');
  const [territorialSelectorKey, setTerritorialSelectorKey] = useState(0);
  const [pendingLocalDraft, setPendingLocalDraft] =
    useState<RelevamientoLocalDraft | null>(null);
  const [localDraftsIndex, setLocalDraftsIndex] =
    useState<RelevamientoLocalDraftIndexItem[]>([]);
  const [showLocalDraftsModal, setShowLocalDraftsModal] = useState(false);
  const [localDraftToRetomar, setLocalDraftToRetomar] =
    useState<RelevamientoLocalDraftIndexItem | null>(null);
  const [serverDrafts, setServerDrafts] = useState<BackendBorradorServidorItem[]>([]);
  const [serverDraftsLoading, setServerDraftsLoading] = useState(false);
  const [serverDraftsError, setServerDraftsError] = useState('');
  const [showServerDraftsModal, setShowServerDraftsModal] = useState(false);
  const [serverDraftToRetomar, setServerDraftToRetomar] =
    useState<BackendBorradorServidorItem | null>(null);
  const [serverDraftsForSelectedPredio, setServerDraftsForSelectedPredio] = useState<
    BackendBorradorServidorItem[]
  >([]);
  const [localDraftFallbackForSelectedPredio, setLocalDraftFallbackForSelectedPredio] =
    useState<RelevamientoLocalDraftIndexItem | null>(null);
  const [pendingDraftSourceForPredio, setPendingDraftSourceForPredio] = useState<
    'server' | 'local' | null
  >(null);
  const [serverDraftForPredioError, setServerDraftForPredioError] = useState('');
  const [showServerDraftForPredioModal, setShowServerDraftForPredioModal] = useState(false);
  const [showPredioYaRelevadoModal, setShowPredioYaRelevadoModal] = useState(false);
  const [isCheckingServerDraftBeforeAdvance, setIsCheckingServerDraftBeforeAdvance] =
    useState(false);
  const [serverDraftRetomarReturnTo, setServerDraftRetomarReturnTo] = useState<
    'general' | 'predio' | null
  >(null);
  const [draftStatus, setDraftStatus] = useState<LocalDraftStatus>('SIN_BORRADOR');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [draftRecoveryChecked, setDraftRecoveryChecked] = useState(false);
  const [pendingConfirmAction, setPendingConfirmAction] =
    useState<FlowConfirmAction | null>(null);
  const sectionStepperRef = useRef<HTMLDivElement | null>(null);
  const sectionValidationAlertRef = useRef<HTMLDivElement | null>(null);

  const currentIndex = sections.findIndex((section) => section.id === currentSectionId);
  const currentSection = sections[currentIndex] ?? sections[0];

  const visitaPermiteContinuar = permiteContinuarFormulario(resultadoVisita.resultado);
  const visitaTieneCorteTemprano = esCorteTemprano(resultadoVisita.resultado);
  const seccionInicialCompleta = Boolean(selectedPredio) && visitaPermiteContinuar;
  const cantidadHogaresDeclarada = Number(vivienda.cantidadHogaresDeclarada);
  const cantidadHogaresDeclaradaValida =
    Number.isInteger(cantidadHogaresDeclarada) &&
    cantidadHogaresDeclarada > 0 &&
    cantidadHogaresDeclarada <= MAX_HOGARES_DECLARADOS;
  const cantidadHogaresCoincide =
    cantidadHogaresDeclaradaValida && cantidadHogaresDeclarada === hogares.length;

  const activeLocalDraftKey = buildLocalDraftKey({
    selectedPredioId,
    selectedPredio,
    selectedCuadrante,
  });

  const predioActualLabel = getPredioActualLabel(selectedPredio, selectedPredioId);
  const cuadranteActualLabel = getCuadranteActualLabel(selectedCuadrante, selectedPredio);

  const hasStartedDraft = Boolean(
    selectedPredioId ||
      resultadoVisita.resultado ||
      vivienda.cantidadHogaresDeclarada ||
      vivienda.vinculoEntreHogares ||
      vivienda.observacionesVivienda ||
      hogares.length > 0 ||
      Object.keys(personasContactosPorHogar).length > 0 ||
      cierre.observacionesGenerales ||
      cierre.latitud ||
      cierre.longitud ||
      cierre.horaCaptura,
  );

  const hasPostVisitData = Boolean(
    vivienda.cantidadHogaresDeclarada ||
      vivienda.vinculoEntreHogares ||
      vivienda.observacionesVivienda ||
      hogares.length > 0 ||
      Object.keys(personasContactosPorHogar).length > 0 ||
      cierre.observacionesGenerales ||
      cierre.latitud ||
      cierre.longitud ||
      cierre.horaCaptura,
  );

  const hasInitialChangeRiskData = Boolean(
    resultadoVisita.resultado ||
      resultadoVisita.motivoNegativa ||
      resultadoVisita.referencia ||
      resultadoVisita.contacto ||
      resultadoVisita.horario ||
      resultadoVisita.observacion ||
      hasPostVisitData,
  );

  const getLocalDraftSectionLabel = (sectionId: RelevamientoSectionId) =>
    sections.find((section) => section.id === sectionId)?.title ?? sectionId;

  const refreshLocalDraftsIndex = () => {
    setLocalDraftsIndex(getLocalDraftsIndex());
  };

  const refreshServerDrafts = async () => {
    if (getRelevamientoFinalizationMode() !== 'backend') {
      setServerDrafts([]);
      setServerDraftsError('');
      return;
    }

    setServerDraftsLoading(true);
    setServerDraftsError('');

    try {
      const drafts = await listarBorradoresServidorPendientes();
      setServerDrafts(drafts.filter((draft) => !draft.completed));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudieron cargar los borradores servidor.';
      setServerDraftsError(message);
    } finally {
      setServerDraftsLoading(false);
    }
  };

  const consultarBorradoresServidorPorPredio = async (
    predioId: string,
    predioDetalle: PredioDetalle | null,
  ) => {
    const fallbackToLocalDraft = (message = '') => {
      const offeredLocalDraft = maybeOfferLocalDraftRecovery(predioId, predioDetalle, message);

      if (!offeredLocalDraft) {
        setServerDraftsForSelectedPredio([]);
        setLocalDraftFallbackForSelectedPredio(null);
        setPendingDraftSourceForPredio(null);
        setServerDraftForPredioError('');
        setShowServerDraftForPredioModal(false);
      }
    };

    if (getRelevamientoFinalizationMode() !== 'backend') {
      fallbackToLocalDraft();
      return;
    }

    if (!predioDetalle || predioDetalle.origen === 'manual') {
      fallbackToLocalDraft();
      return;
    }

    const backendPredioId = predioDetalle.id || predioId;

    if (!backendPredioId) {
      fallbackToLocalDraft();
      return;
    }

    try {
      const drafts = await listarBorradoresServidorPorPredio(backendPredioId);
      const pendingDrafts = drafts.filter((draft) => !draft.completed);

      if (pendingDrafts.length > 0) {
        setServerDraftsForSelectedPredio(pendingDrafts);
        setLocalDraftFallbackForSelectedPredio(null);
        setPendingDraftSourceForPredio('server');
        setServerDraftForPredioError('');
        setShowServerDraftForPredioModal(true);
        return;
      }

      fallbackToLocalDraft();
    } catch {
      fallbackToLocalDraft(
        'No se pudo consultar el servidor. Se usará el respaldo local disponible en esta tablet.',
      );
    }
  };

  const getSafeDraftSectionId = (sectionId: RelevamientoSectionId) =>
    sections.some((section) => section.id === sectionId)
      ? sectionId
      : 'inicio-predio-visita';

  useEffect(() => {
    refreshLocalDraftsIndex();

    if (getRelevamientoFinalizationMode() === 'backend') {
      void refreshServerDrafts();
    }
  }, []);

  const canGoBack = currentIndex > 0;
  const canGoForward =
    currentIndex < sections.length - 1 &&
    !(currentSection.id === 'inicio-predio-visita' && visitaTieneCorteTemprano);

  const nextSectionTitle = useMemo(() => {
    if (currentSection.id === 'inicio-predio-visita' && visitaTieneCorteTemprano) {
      return 'Corte temprano';
    }

    if (currentSection.id === 'inicio-predio-visita' && !seccionInicialCompleta) {
      return 'Completar Sección 1';
    }

    if (currentSection.id === 'vivienda-hogares' && !cantidadHogaresCoincide) {
      return 'Completar hogares declarados';
    }

    if (!canGoForward) {
      return 'Completar Sección 1';
    }

    return sections[currentIndex + 1]?.title ?? 'Siguiente sección';
  }, [
    canGoForward,
    cantidadHogaresCoincide,
    seccionInicialCompleta,
    currentIndex,
    currentSection.id,
    visitaTieneCorteTemprano,
  ]);

  const buildLocalDraft = (overrides: Partial<RelevamientoLocalDraft> = {}): RelevamientoLocalDraft => ({
    version: 1,
    savedAt: new Date().toISOString(),
    currentSectionId,
    selectedPredioId,
    selectedPredio,
    selectedCuadrante,
    resultadoVisita,
    vivienda,
    hogares,
    personasContactosPorHogar,
    cierre,
    finalizacionSimulada: finalizacionCompletada,
    serverDraftId,
    serverDraftVersion,
    serverDraftLastSyncedAt,
    serverDraftSyncStatus,
    serverDraftSyncError,
    ...overrides,
  });

  const markDraftPending = () => {
    setFinalizacionCompletada(false);
    setFinalizationError('');
    setFinalizationValidationErrors([]);
    setShowBorradorPendienteGuardadoModal(false);
    setDraftStatus('CAMBIOS_PENDIENTES');
  };

  const clearServerDraftBinding = () => {
    setServerDraftId(null);
    setServerDraftVersion(null);
    setServerDraftLastSyncedAt('');
    setServerDraftSyncStatus('SIN_BORRADOR_SERVIDOR');
    setServerDraftSyncError('');
  };

  useEffect(() => {
    const shouldPrefillCaptureTime =
      (currentSection.id === 'cierre-finalizacion' ||
        (currentSection.id === 'inicio-predio-visita' && visitaTieneCorteTemprano)) &&
      !cierre.horaCaptura;

    if (!shouldPrefillCaptureTime) {
      return;
    }

    setCierre((currentCierre) => {
      if (currentCierre.horaCaptura) {
        return currentCierre;
      }

      return {
        ...currentCierre,
        horaCaptura: formatCurrentTimeForInput(),
      };
    });

    markDraftPending();
  }, [cierre.horaCaptura, currentSection.id, visitaTieneCorteTemprano]);

  useEffect(() => {
    const existingDraft = getLocalDraft();

    if (existingDraft) {
      setPendingLocalDraft(existingDraft);
      setLastSavedAt(existingDraft.savedAt);
      setDraftStatus('SIN_BORRADOR');
    }

    setDraftRecoveryChecked(true);
  }, []);

  useEffect(() => {
    if (!draftRecoveryChecked || pendingLocalDraft || !hasStartedDraft) {
      return;
    }

    const draft = buildLocalDraft();
    const saved = saveLocalDraft(draft);
    refreshLocalDraftsIndex();

    if (saved) {
      setLastSavedAt(draft.savedAt);
      setDraftStatus('GUARDADO_LOCAL');
      return;
    }

    setDraftStatus('ERROR_GUARDAR');
  }, [
    cierre,
    currentSectionId,
    draftRecoveryChecked,
    finalizacionCompletada,
    hasStartedDraft,
    hogares,
    pendingLocalDraft,
    personasContactosPorHogar,
    resultadoVisita,
    selectedPredio,
    selectedPredioId,
    selectedCuadrante,
    vivienda,
  ]);

  const applyLocalDraft = (draft: RelevamientoLocalDraft) => {
    setCurrentSectionId(getSafeDraftSectionId(draft.currentSectionId));
    setSelectedPredioId(draft.selectedPredioId);
    setSelectedPredio(draft.selectedPredio);
    setSelectedCuadrante(draft.selectedCuadrante ?? null);
    setShowCuadranteImageModal(false);
    setResultadoVisita(draft.resultadoVisita);
    setVivienda(draft.vivienda);
    setHogares(draft.hogares);
    setPersonasContactosPorHogar(draft.personasContactosPorHogar);
    setCierre(draft.cierre);
    setFinalizacionCompletada(draft.finalizacionSimulada);
    setServerDraftId(draft.serverDraftId ?? null);
    setServerDraftVersion(draft.serverDraftVersion ?? null);
    setServerDraftLastSyncedAt(draft.serverDraftLastSyncedAt ?? '');
    setServerDraftSyncStatus(draft.serverDraftSyncStatus ?? 'SIN_BORRADOR_SERVIDOR');
    setServerDraftSyncError(draft.serverDraftSyncError ?? '');
    setLastSavedAt(draft.savedAt);
    setPendingLocalDraft(null);
    setDraftStatus('BORRADOR_RECUPERADO');
    scrollToSectionStepper();
  };

  const requestDiscardLocalDraft = () => {
    setPendingConfirmAction({ type: 'discard-local-draft' });
  };

  const discardLocalDraft = () => {
    clearLocalDraft();
    refreshLocalDraftsIndex();
    setPendingLocalDraft(null);
    setLastSavedAt('');
    setDraftStatus('SIN_BORRADOR');
    setServerDraftId(null);
    setServerDraftVersion(null);
    setServerDraftLastSyncedAt('');
    setServerDraftSyncStatus('SIN_BORRADOR_SERVIDOR');
    setServerDraftSyncError('');
  };

  const resetCierre = () => {
    setCierre(cierreRelevamientoInicial);
    setFinalizacionCompletada(false);
  };

  const resetPersonasContactos = () => {
    setPersonasContactosPorHogar({});
    resetCierre();
  };

  const resetViviendaHogares = () => {
    setVivienda(viviendaInicial);
    setHogares([]);
    resetPersonasContactos();
  };


  const requestRetomarLocalDraftByKey = (draftKey: string) => {
    const draftToRetomar = localDraftsIndex.find((draft) => draft.draftKey === draftKey);

    if (!draftToRetomar) {
      refreshLocalDraftsIndex();
      setFinalizationError(
        'No se encontró ese borrador local. Puede haber sido descartado o eliminado del navegador.',
      );
      return;
    }

    setLocalDraftToRetomar(draftToRetomar);
    setShowLocalDraftsModal(false);
  };

  const handleRetomarLocalDraftByKey = (draftKey: string) => {
    const draft = getLocalDraftByKey(draftKey);

    if (!draft) {
      refreshLocalDraftsIndex();
      setFinalizationError(
        'No se pudo recuperar ese borrador local. Puede haber sido descartado o eliminado del navegador.',
      );
      return;
    }

    saveLocalDraft(draft);
    applyLocalDraft(draft);
    refreshLocalDraftsIndex();
    setFinalizationError('');
  };

  const resetActiveDraftState = () => {
    setCurrentSectionId('inicio-predio-visita');
    setSelectedPredioId('');
    setSelectedPredio(null);
    setSelectedCuadrante(null);
    setResultadoVisita(resultadoVisitaInicial);
    setVivienda(viviendaInicial);
    setHogares([]);
    setPersonasContactosPorHogar({});
    setCierre(cierreRelevamientoInicial);
    setFinalizacionCompletada(false);
    setFinalizationError('');
    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setServerDraftId(null);
    setServerDraftVersion(null);
    setServerDraftLastSyncedAt('');
    setServerDraftSyncStatus('SIN_BORRADOR_SERVIDOR');
    setServerDraftSyncError('');
    setPendingLocalDraft(null);
    setDraftStatus('SIN_BORRADOR');
    setLastSavedAt('');
    setTerritorialSelectorKey((currentKey) => currentKey + 1);
  };

  const handleDescartarLocalDraftByKey = (draftKey: string) => {
    const confirmed = window.confirm(
      '¿Descartar este borrador local? Esta acción solo elimina la copia guardada en esta tablet.',
    );

    if (!confirmed) {
      return;
    }

    removeLocalDraftByKey(draftKey);

    if (activeLocalDraftKey === draftKey) {
      clearLocalDraft();
      resetActiveDraftState();
    }

    refreshLocalDraftsIndex();
  };

  const hasUsefulLocalDraftRecoveryData = (draft: RelevamientoLocalDraft) =>
    Boolean(
      draft.currentSectionId !== 'inicio-predio-visita' ||
        draft.resultadoVisita.resultado ||
        draft.resultadoVisita.motivoNegativa ||
        draft.resultadoVisita.referencia ||
        draft.resultadoVisita.contacto ||
        draft.resultadoVisita.horario ||
        draft.resultadoVisita.observacion ||
        draft.vivienda.cantidadHogaresDeclarada ||
        draft.vivienda.vinculoEntreHogares ||
        draft.vivienda.observacionesVivienda ||
        draft.hogares.length > 0 ||
        Object.keys(draft.personasContactosPorHogar).length > 0 ||
        draft.cierre.observacionesGenerales ||
        draft.cierre.latitud ||
        draft.cierre.longitud ||
        draft.cierre.horaCaptura ||
        draft.serverDraftId,
    );

  const maybeOfferLocalDraftRecovery = (
    nextSelectedPredioId: string,
    nextSelectedPredio: PredioDetalle | null,
    message = '',
  ) => {
    if (!nextSelectedPredio) {
      return false;
    }

    const selectedDraftReference = {
      selectedPredioId: nextSelectedPredioId,
      selectedPredio: nextSelectedPredio,
      selectedCuadrante,
    };

    const existingDraft = findLocalDraftForSelectedPredio(selectedDraftReference);
    const nextIndex = getLocalDraftsIndex();
    setLocalDraftsIndex(nextIndex);

    if (!existingDraft || activeLocalDraftKey === existingDraft.draftKey) {
      return false;
    }

    const fullLocalDraft = getLocalDraftByKey(existingDraft.draftKey);

    if (!fullLocalDraft || !hasUsefulLocalDraftRecoveryData(fullLocalDraft)) {
      return false;
    }

    setServerDraftsForSelectedPredio([]);
    setLocalDraftFallbackForSelectedPredio(existingDraft);
    setPendingDraftSourceForPredio('local');
    setServerDraftForPredioError(message);
    setShowServerDraftForPredioModal(true);
    return true;
  };

  const handleConfirmRetomarLocalDraft = () => {
    if (!localDraftToRetomar) {
      return;
    }

    handleRetomarLocalDraftByKey(localDraftToRetomar.draftKey);
    setLocalDraftToRetomar(null);
    setShowLocalDraftsModal(false);
  };

  const handleCancelRetomarLocalDraft = () => {
    setLocalDraftToRetomar(null);
    setShowLocalDraftsModal(true);
  };

  const handleOpenServerDraftsModal = () => {
    setShowServerDraftsModal(true);
    void refreshServerDrafts();
  };

  const requestRetomarServerDraft = (draftId: number) => {
    const draft = [...serverDrafts, ...serverDraftsForSelectedPredio].find(
      (serverDraft) => serverDraft.id === draftId,
    );

    if (!draft) {
      setServerDraftsError(
        'No se encontró esa carga pendiente. Puede haber sido finalizada o eliminada.',
      );
      void refreshServerDrafts();
      return;
    }

    setServerDraftRetomarReturnTo(showServerDraftForPredioModal ? 'predio' : 'general');
    setServerDraftToRetomar(draft);
    setShowServerDraftsModal(false);
    setShowServerDraftForPredioModal(false);
    setPendingDraftSourceForPredio(null);
  };

  const handleConfirmRetomarServerDraft = () => {
    if (!serverDraftToRetomar) {
      return;
    }

    const draft = buildLocalDraftFromServerDraft(serverDraftToRetomar);
    saveLocalDraft(draft);
    applyLocalDraft(draft);
    refreshLocalDraftsIndex();
    setFinalizationError('');
    setServerDraftToRetomar(null);
    setShowServerDraftsModal(false);
    setShowServerDraftForPredioModal(false);
    setServerDraftRetomarReturnTo(null);
    setPendingDraftSourceForPredio(null);
    setLocalDraftFallbackForSelectedPredio(null);
    void refreshServerDrafts();
  };

  const handleCancelRetomarServerDraft = () => {
    setServerDraftToRetomar(null);

    if (serverDraftRetomarReturnTo === 'predio') {
      setShowServerDraftForPredioModal(true);
    } else if (serverDraftRetomarReturnTo === 'general') {
      setShowServerDraftsModal(true);
    }

    setServerDraftRetomarReturnTo(null);
  };

  const handleRetomarLocalFallbackForPredio = () => {
    if (!localDraftFallbackForSelectedPredio) {
      return;
    }

    handleRetomarLocalDraftByKey(localDraftFallbackForSelectedPredio.draftKey);
    setLocalDraftFallbackForSelectedPredio(null);
    setPendingDraftSourceForPredio(null);
    setServerDraftForPredioError('');
    setShowServerDraftForPredioModal(false);
  };

  const handleContinueWithoutServerDraftForPredio = () => {
    setShowServerDraftForPredioModal(false);
    setServerDraftsForSelectedPredio([]);
    setLocalDraftFallbackForSelectedPredio(null);
    setPendingDraftSourceForPredio(null);
    setServerDraftForPredioError('');
  };

  const handleCuadranteSelected = (cuadrante: CuadranteOption | null) => {
    setSelectedCuadrante(cuadrante);

    if (!cuadrante) {
      setShowCuadranteImageModal(false);
    }
  };

  const handlePredioSelected = (predioId: string, predioDetalle: PredioDetalle | null) => {
    const isSamePredio = predioId === selectedPredioId;

    setSelectedPredioId(predioId);
    setSelectedPredio(predioDetalle);

    if (isSamePredio) {
      markDraftPending();
      void consultarBorradoresServidorPorPredio(predioId, predioDetalle);
      return;
    }

    clearServerDraftBinding();
    setResultadoVisita(resultadoVisitaInicial);
    resetViviendaHogares();
    setCurrentSectionId('inicio-predio-visita');
    markDraftPending();
    void consultarBorradoresServidorPorPredio(predioId, predioDetalle);
  };

  const requestTerritorialChange = (applyChange: () => void) => {
    if (!hasInitialChangeRiskData) {
      applyChange();
      return;
    }

    setPendingConfirmAction({ type: 'change-territorial-selection', applyChange });
  };

  const applyResultadoVisitaChange = (nextResultado: ResultadoVisitaFormState) => {
    setResultadoVisita(nextResultado);
    markDraftPending();

    if (!permiteContinuarFormulario(nextResultado.resultado)) {
      resetViviendaHogares();
      setCurrentSectionId('inicio-predio-visita');
    }
  };

  const handleResultadoVisitaChange = (nextResultado: ResultadoVisitaFormState) => {
    const resultadoChanged = nextResultado.resultado !== resultadoVisita.resultado;
    const enteringCutoff =
      resultadoChanged &&
      permiteContinuarFormulario(resultadoVisita.resultado) &&
      !permiteContinuarFormulario(nextResultado.resultado);
    const requiresCutoffConfirmation = enteringCutoff && hasPostVisitData;

    if (requiresCutoffConfirmation) {
      setPendingConfirmAction({
        type: 'change-resultado-corte-temprano',
        nextResultado,
      });
      return;
    }

    applyResultadoVisitaChange(nextResultado);
  };

  const handleViviendaChange = (nextVivienda: ViviendaFormState) => {
    setVivienda(nextVivienda);

    const cantidadDeclarada = Number(nextVivienda.cantidadHogaresDeclarada);
    const debeCrearHogares =
      Number.isInteger(cantidadDeclarada) &&
      cantidadDeclarada > 0 &&
      cantidadDeclarada <= MAX_HOGARES_DECLARADOS;

    if (debeCrearHogares) {
      setHogares((currentHogares) => {
        if (cantidadDeclarada <= currentHogares.length) {
          return currentHogares;
        }

        const nextHogares = [...currentHogares];

        for (let index = currentHogares.length; index < cantidadDeclarada; index += 1) {
          nextHogares.push(crearHogarInicial(index + 1));
        }

        return nextHogares;
      });
    }

    markDraftPending();
  };

  const addHogar = () => {
    setHogares((currentHogares) => [
      ...currentHogares,
      crearHogarInicial(currentHogares.length + 1),
    ]);
    setFinalizacionCompletada(false);
    markDraftPending();
  };

  const updateHogar = (updatedHogar: HogarFormState) => {
    setHogares((currentHogares) =>
      currentHogares.map((hogar) =>
        hogar.id === updatedHogar.id ? updatedHogar : hogar,
      ),
    );
    setFinalizacionCompletada(false);
    markDraftPending();
  };

  const requestRemoveHogar = (hogarId: string) => {
    setPendingConfirmAction({ type: 'remove-hogar', hogarId });
  };

  const removeHogar = (hogarId: string) => {
    setHogares((currentHogares) =>
      currentHogares.filter((hogar) => hogar.id !== hogarId),
    );

    setPersonasContactosPorHogar((currentState) => {
      const nextState = { ...currentState };
      delete nextState[hogarId];
      return nextState;
    });

    setFinalizacionCompletada(false);
    markDraftPending();
  };

  const confirmActionContent =
    pendingConfirmAction?.type === 'discard-local-draft'
      ? {
          title: 'Descartar información guardada',
          message:
            '¿Descartar la información guardada en este dispositivo? Esta acción no se puede deshacer.',
          confirmLabel: 'Descartar',
        }
      : pendingConfirmAction?.type === 'remove-hogar'
        ? {
            title: 'Eliminar hogar',
            message:
              '¿Eliminar este hogar? También se eliminarán las personas, contactos, servicios y datos de salud cargados para este hogar. Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar hogar',
          }
        : pendingConfirmAction?.type === 'change-territorial-selection'
          ? {
              title: 'Cambiar selección territorial',
              message:
                'Cambiar la selección territorial reiniciará los datos cargados del relevamiento actual. Esta acción no se puede deshacer.',
              confirmLabel: 'Cambiar selección',
            }
          : pendingConfirmAction?.type === 'change-resultado-corte-temprano'
            ? {
                title: 'Cerrar carga por resultado de visita',
                message:
                  'Este resultado cerrará la carga del formulario y eliminará vivienda, hogares, personas, contactos, servicios, salud y datos de cierre cargados. Esta acción no se puede deshacer.',
                confirmLabel: 'Aplicar resultado',
              }
            : pendingConfirmAction?.type === 'finalize-relevamiento'
              ? {
                  title: 'Finalizar relevamiento',
                  message:
                    'Se guardará la información cargada y se iniciará un nuevo formulario. Esta acción no se puede deshacer.',
                  confirmLabel: 'Finalizar relevamiento',
                }
              : null;

  const cancelConfirmAction = () => {
    setPendingConfirmAction(null);
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmAction) {
      return;
    }

    if (pendingConfirmAction.type === 'discard-local-draft') {
      discardLocalDraft();
      setPendingConfirmAction(null);
      return;
    }

    if (pendingConfirmAction.type === 'remove-hogar') {
      removeHogar(pendingConfirmAction.hogarId);
      setPendingConfirmAction(null);
      return;
    }

    if (pendingConfirmAction.type === 'change-territorial-selection') {
      pendingConfirmAction.applyChange();
      setPendingConfirmAction(null);
      return;
    }

    if (pendingConfirmAction.type === 'finalize-relevamiento') {
      finalizarRelevamiento();
      setPendingConfirmAction(null);
      return;
    }

    applyResultadoVisitaChange(pendingConfirmAction.nextResultado);
    setPendingConfirmAction(null);
  };

  const handlePersonasContactosChange = (nextState: PersonasContactosPorHogarState) => {
    setPersonasContactosPorHogar(nextState);
    setFinalizacionCompletada(false);
    markDraftPending();
  };

  const handleCierreChange = (nextCierre: CierreRelevamientoFormState) => {
    setCierre(nextCierre);
    setFinalizacionCompletada(false);
    markDraftPending();
  };

  const resetFormularioActivoSinEliminarSnapshots = () => {
    window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
    setCurrentSectionId('inicio-predio-visita');
    setSelectedPredioId('');
    setSelectedPredio(null);
    setSelectedCuadrante(null);
    setShowCuadranteImageModal(false);
    setResultadoVisita(resultadoVisitaInicial);
    setVivienda(viviendaInicial);
    setHogares([]);
    setPersonasContactosPorHogar({});
    setCierre(cierreRelevamientoInicial);
    setPendingLocalDraft(null);
    setLastSavedAt('');
    setDraftStatus('SIN_BORRADOR');
    setFinalizationError('');
    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setServerDraftId(null);
    setServerDraftVersion(null);
    setServerDraftLastSyncedAt('');
    setServerDraftSyncStatus('SIN_BORRADOR_SERVIDOR');
    setServerDraftSyncError('');
    setPendingConfirmAction(null);
    setLocalDraftToRetomar(null);
    setServerDraftToRetomar(null);
    setServerDraftsForSelectedPredio([]);
    setLocalDraftFallbackForSelectedPredio(null);
    setPendingDraftSourceForPredio(null);
    setServerDraftForPredioError('');
    setShowLocalDraftsModal(false);
    setShowServerDraftsModal(false);
    setShowServerDraftForPredioModal(false);
    setShowPredioYaRelevadoModal(false);
    setServerDraftRetomarReturnTo(null);
    setTerritorialSelectorKey((currentKey) => currentKey + 1);
    refreshLocalDraftsIndex();
    scrollToSectionStepper();
  };

  const handleLimpiarPredioYaRelevado = () => {
    setShowPredioYaRelevadoModal(false);
    resetFormularioActivoSinEliminarSnapshots();
  };

  const handleGuardarBorradorHogaresPendientes = () => {
    persistLocalDraft();
    setShowHogaresPendientesFinalizacionModal(false);
    resetFormularioActivoSinEliminarSnapshots();
    setShowBorradorPendienteGuardadoModal(true);
  };

  const handleIrSeccionHogaresPendientes = () => {
    persistLocalDraft({ currentSectionId: 'vivienda-hogares' });
    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setFinalizationError('');
    setShowHogaresPendientesFinalizacionModal(false);
    setCurrentSectionId('vivienda-hogares');
    scrollToSectionStepper();
  };

  const resetRelevamiento = () => {
    clearLocalDraft();
    refreshLocalDraftsIndex();
    setCurrentSectionId('inicio-predio-visita');
    setSelectedPredioId('');
    setSelectedPredio(null);
    setSelectedCuadrante(null);
    setShowCuadranteImageModal(false);
    setResultadoVisita(resultadoVisitaInicial);
    setVivienda(viviendaInicial);
    setHogares([]);
    setPersonasContactosPorHogar({});
    setCierre(cierreRelevamientoInicial);
    setPendingLocalDraft(null);
    setLastSavedAt('');
    setDraftStatus('SIN_BORRADOR');
    setFinalizationError('');
    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setPendingConfirmAction(null);
    setTerritorialSelectorKey((currentKey) => currentKey + 1);
  };

  const buildBackendSnapshot = (sectionId: RelevamientoSectionId = currentSectionId) => ({
    currentSectionId: sectionId,
    selectedPredioId,
    selectedPredio,
    selectedCuadrante,
    resultadoVisita,
    vivienda,
    hogares,
    personasContactosPorHogar,
    cierre,
  });

  const persistLocalDraft = (overrides: Partial<RelevamientoLocalDraft> = {}) => {
    const draft = buildLocalDraft(overrides);
    const saved = saveLocalDraft(draft);
    refreshLocalDraftsIndex();

    if (saved) {
      setLastSavedAt(draft.savedAt);
      setDraftStatus('GUARDADO_LOCAL');
      return draft;
    }

    setDraftStatus('ERROR_GUARDAR');
    return draft;
  };

  const persistServerMetadataLocally = (metadata: Partial<RelevamientoLocalDraft>) => {
    saveLocalDraft(buildLocalDraft(metadata));
    refreshLocalDraftsIndex();
  };

  const syncServerDraftNoBloqueante = async (
    snapshot: ReturnType<typeof buildBackendSnapshot>,
  ) => {
    if (getRelevamientoFinalizationMode() !== 'backend') {
      return;
    }

    setServerDraftSyncStatus('SINCRONIZANDO');
    setServerDraftSyncError('');

    try {
      const result = await guardarBorradorServidor({
        snapshot,
        serverDraftId,
        serverDraftVersion,
      });

      const syncedAt = new Date().toISOString();

      setServerDraftId(result.borradorId);
      setServerDraftVersion(result.draftVersion);
      setServerDraftLastSyncedAt(syncedAt);
      setServerDraftSyncStatus('SINCRONIZADO');
      setServerDraftSyncError('');

      persistServerMetadataLocally({
        currentSectionId: snapshot.currentSectionId,
        serverDraftId: result.borradorId,
        serverDraftVersion: result.draftVersion,
        serverDraftLastSyncedAt: syncedAt,
        serverDraftSyncStatus: 'SINCRONIZADO',
        serverDraftSyncError: '',
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo sincronizar con el servidor.';

      if (isPredioConCargaExistenteError(error)) {
        setShowPredioYaRelevadoModal(true);
      }

      const backendValidationErrors = buildBackendValidationErrors(error);

      if (backendValidationErrors.length > 0) {
        setSectionValidationErrors(backendValidationErrors);
        setFinalizationValidationErrors([]);
        scrollToSectionValidationAlert();
      }

      setServerDraftSyncStatus('ERROR_SINCRONIZACION');
      setServerDraftSyncError(message);

      persistServerMetadataLocally({
        currentSectionId: snapshot.currentSectionId,
        serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
        serverDraftSyncError: message,
      });
    }
  };

  const shouldValidateServerDraftBeforeLeavingInitialSection = () =>
    getRelevamientoFinalizationMode() === 'backend' &&
    currentSection.id === 'inicio-predio-visita' &&
    Boolean(selectedPredio) &&
    selectedPredio?.origen !== 'manual' &&
    !serverDraftId;

  const ensureServerDraftBeforeLeavingInitialSection = async (
    targetSectionId: RelevamientoSectionId,
  ) => {
    if (!shouldValidateServerDraftBeforeLeavingInitialSection()) {
      return true;
    }

    setIsCheckingServerDraftBeforeAdvance(true);
    setServerDraftSyncStatus('SINCRONIZANDO');
    setServerDraftSyncError('');

    try {
      const result = await guardarBorradorServidor({
        snapshot: buildBackendSnapshot(targetSectionId),
        serverDraftId,
        serverDraftVersion,
      });
      const syncedAt = new Date().toISOString();

      setServerDraftId(result.borradorId);
      setServerDraftVersion(result.draftVersion);
      setServerDraftLastSyncedAt(syncedAt);
      setServerDraftSyncStatus('SINCRONIZADO');
      setServerDraftSyncError('');

      persistServerMetadataLocally({
        currentSectionId: targetSectionId,
        serverDraftId: result.borradorId,
        serverDraftVersion: result.draftVersion,
        serverDraftLastSyncedAt: syncedAt,
        serverDraftSyncStatus: 'SINCRONIZADO',
        serverDraftSyncError: '',
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo sincronizar con el servidor.';

      setServerDraftSyncStatus('ERROR_SINCRONIZACION');
      setServerDraftSyncError(message);

      if (isPredioConCargaExistenteError(error)) {
        setShowPredioYaRelevadoModal(true);
        return false;
      }

      const backendValidationErrors = buildBackendValidationErrors(error);

      if (backendValidationErrors.length > 0) {
        setSectionValidationErrors(backendValidationErrors);
        setFinalizationValidationErrors([]);
        scrollToSectionValidationAlert();
        persistServerMetadataLocally({
          currentSectionId: targetSectionId,
          serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
          serverDraftSyncError: message,
        });
        return false;
      }

      persistServerMetadataLocally({
        currentSectionId: targetSectionId,
        serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
        serverDraftSyncError: message,
      });

      return true;
    } finally {
      setIsCheckingServerDraftBeforeAdvance(false);
    }
  };

  const buildSectionValidationResult = (
    errors: FinalizacionValidationError[],
  ): FinalizacionValidationResult => ({
    valid: errors.length === 0,
    errors,
  });

  const validateSectionForAdvance = (
    sectionId: RelevamientoSectionId,
  ): FinalizacionValidationResult => {
    const snapshot = buildBackendSnapshot(sectionId);

    if (sectionId === 'inicio-predio-visita') {
      return validateInicioPredioVisita(snapshot);
    }

    if (sectionId === 'vivienda-hogares') {
      return validateViviendaHogares(snapshot);
    }

    if (sectionId === 'datos-por-hogar') {
      return validatePersonasContactos(snapshot);
    }

    return validateCierreRelevamiento(snapshot);
  };

  const validateCurrentSectionBeforeAdvance = (): FinalizacionValidationResult => {
    if (currentSection.id === 'inicio-predio-visita' && visitaTieneCorteTemprano) {
      return buildSectionValidationResult([
        {
          campo: 'resultadoVisita.resultado',
          mensaje: 'Resultado de visita: este resultado se finaliza desde la Sección 1.',
        },
      ]);
    }

    return validateSectionForAdvance(currentSection.id);
  };

  const validateSectionsBeforeNavigation = (
    targetSectionId: RelevamientoSectionId,
  ): FinalizacionValidationResult => {
    const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
    const errors: FinalizacionValidationError[] = [];

    if (targetIndex <= 0) {
      return buildSectionValidationResult(errors);
    }

    for (let index = 0; index < targetIndex; index += 1) {
      const sectionId = sections[index].id;

      if (sectionId === 'inicio-predio-visita' && visitaTieneCorteTemprano) {
        errors.push({
          campo: 'resultadoVisita.resultado',
          mensaje: 'Resultado de visita: este resultado se finaliza desde la Sección 1.',
        });
        break;
      }

      errors.push(...validateSectionForAdvance(sectionId).errors);
    }

    return buildSectionValidationResult(errors);
  };

  const escapeSelectorValue = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\\"');

  const buildIdSelector = (id: string) => `[id="${escapeSelectorValue(id)}"]`;

  const buildDataValidationHogarSelector = (hogarIndex: number) =>
    `[data-validation-hogar="hogares.${hogarIndex}"]`;

  const buildDataValidationHogarHeaderSelector = (hogarIndex: number) =>
    `[data-validation-hogar-header="hogares.${hogarIndex}"]`;

  const buildDataValidationCardSelector = (campo: string) =>
    `[data-validation-card="${escapeSelectorValue(campo)}"]`;

  const buildHogarCardSelector = (hogarIndex: number, card: string) =>
    buildDataValidationCardSelector(`hogares.${hogarIndex}.${card}`);

  const buildHogarScopedIdSelector = (hogarIndex: number, id: string) =>
    `${buildDataValidationHogarSelector(hogarIndex)} ${buildIdSelector(id)}`;

  const getIndexedHogar = (hogarIndex: number) => hogares[hogarIndex] ?? null;

  const getDatosHogarByIndex = (hogarIndex: number) => {
    const hogar = getIndexedHogar(hogarIndex);
    return hogar ? personasContactosPorHogar[hogar.id] : undefined;
  };

  const getValidationFocusTarget = (campo: string): ValidationFocusTarget => {
    const parts = campo.split('.');
    const normalizedCampo = campo.toLowerCase();

    if (campo === 'predio') {
      return { sectionId: 'inicio-predio-visita', selector: buildIdSelector('predio') };
    }

    if (campo === 'territorio.cuadrante' || normalizedCampo.includes('cuadrante')) {
      return { sectionId: 'inicio-predio-visita', selector: buildIdSelector('cuadrante') };
    }

    if (normalizedCampo.includes('zona')) {
      return { sectionId: 'inicio-predio-visita', selector: buildIdSelector('zona') };
    }

    if (normalizedCampo.includes('resultadovisita') || normalizedCampo.includes('visita')) {
      return {
        sectionId: 'inicio-predio-visita',
        selector: '[name="resultado-visita"]',
        fallbackSelector: buildIdSelector('resultado-entrevista-realizada'),
      };
    }

    if (campo === 'vivienda.cantidadHogaresDeclarada' || campo === 'hogares') {
      return {
        sectionId: 'vivienda-hogares',
        selector: buildIdSelector('cantidad-hogares-declarada'),
      };
    }

    if (campo === 'vivienda.vinculoEntreHogares') {
      return {
        sectionId: 'vivienda-hogares',
        selector: buildIdSelector('vinculo-entre-hogares'),
      };
    }

    if (campo === 'hogares.estadoHogar') {
      const hogarIndex = hogares.findIndex((hogar) => !hogarEstaEntrevistado(hogar));
      const hogar = hogarIndex >= 0 ? hogares[hogarIndex] : hogares[0];

      return {
        sectionId: 'vivienda-hogares',
        selector: hogar
          ? buildIdSelector(`estado-hogar-${hogar.id}`)
          : buildIdSelector('cantidad-hogares-declarada'),
      };
    }

    if (parts[0] === 'hogares' && parts.length >= 3) {
      const hogarIndex = Number(parts[1]);
      const fieldGroup = parts[2];

      if (Number.isInteger(hogarIndex)) {
        const hogar = getIndexedHogar(hogarIndex);
        const hogarFallbackSelector = buildDataValidationHogarSelector(hogarIndex);

        if (
          fieldGroup === 'tiempoViveBarrio' ||
          fieldGroup === 'beneficiarioRegularizacion' ||
          fieldGroup === 'formaAccesoVivienda'
        ) {
          const fieldIdPrefixByCampo: Record<string, string> = {
            tiempoViveBarrio: 'tiempo-vive-barrio',
            beneficiarioRegularizacion: 'beneficiario-regularizacion',
            formaAccesoVivienda: 'forma-acceso-vivienda',
          };

          return {
            sectionId: 'vivienda-hogares',
            selector: hogar
              ? buildIdSelector(`${fieldIdPrefixByCampo[fieldGroup]}-${hogar.id}`)
              : buildIdSelector('cantidad-hogares-declarada'),
          };
        }

        if (fieldGroup === 'servicios') {
          const serviciosIdByCampo: Record<string, string> = {
            tieneLuzAgua: 'tiene-luz-agua',
            tieneConvenioLuzAgua: 'tiene-convenio-luz-agua',
            tieneCableInternet: 'tiene-cable-internet',
          };
          const field = parts[3] ?? '';
          const serviciosCardSelector = buildHogarCardSelector(hogarIndex, 'servicios');

          return {
            sectionId: 'datos-por-hogar',
            selector: serviciosIdByCampo[field]
              ? buildHogarScopedIdSelector(hogarIndex, serviciosIdByCampo[field])
              : serviciosCardSelector,
            fallbackSelector: serviciosCardSelector,
            hogarIndex,
          };
        }

        if (fieldGroup === 'salud') {
          const saludIdByCampo: Record<string, string> = {
            servicioAtencionMedica: 'servicio-atencion-medica',
            tieneEmergenciaMovil: 'tiene-emergencia-movil',
          };
          const field = parts[3] ?? '';
          const saludCardSelector = buildHogarCardSelector(hogarIndex, 'salud');

          return {
            sectionId: 'datos-por-hogar',
            selector: saludIdByCampo[field]
              ? buildHogarScopedIdSelector(hogarIndex, saludIdByCampo[field])
              : saludCardSelector,
            fallbackSelector: saludCardSelector,
            hogarIndex,
          };
        }

        if (fieldGroup === 'personas') {
          const personasCardSelector = buildHogarCardSelector(hogarIndex, 'personas');

          if (parts.length === 3) {
            return {
              sectionId: 'datos-por-hogar',
              selector: buildDataValidationHogarHeaderSelector(hogarIndex),
              fallbackSelector: hogarFallbackSelector,
              hogarIndex,
            };
          }

          const datosHogar = getDatosHogarByIndex(hogarIndex);

          if (parts[3] === 'referente') {
            const firstPersona = datosHogar?.personas[0];

            return {
              sectionId: 'datos-por-hogar',
              selector: firstPersona
                ? buildIdSelector(`referente-persona-${firstPersona.id}`)
                : personasCardSelector,
              fallbackSelector: personasCardSelector,
              hogarIndex,
            };
          }

          const personaIndex = Number(parts[3]);
          const personaField = parts[4];
          const persona = Number.isInteger(personaIndex)
            ? datosHogar?.personas[personaIndex]
            : null;

          const personaFieldIdPrefixByCampo: Record<string, string> = {
            nombre: 'nombre-persona',
            apellido: 'apellido-persona',
            cedula: 'cedula-persona',
            edad: 'edad-persona',
            sexo: 'sexo-persona',
            ocupacion: 'ocupacion-persona',
            parentescoConReferente: 'parentesco-persona',
          };

          return {
            sectionId: 'datos-por-hogar',
            selector:
              persona && personaFieldIdPrefixByCampo[personaField]
                ? buildIdSelector(`${personaFieldIdPrefixByCampo[personaField]}-${persona.id}`)
                : hogarFallbackSelector,
            fallbackSelector: personasCardSelector,
            hogarIndex,
          };
        }

        if (fieldGroup === 'contactos') {
          const contactosCardSelector = buildHogarCardSelector(hogarIndex, 'contactos');

          if (parts.length === 3) {
            return {
              sectionId: 'datos-por-hogar',
              selector: contactosCardSelector,
              fallbackSelector: hogarFallbackSelector,
              hogarIndex,
            };
          }

          const contactoIndex = Number(parts[3]);
          const contactoField = parts[4];
          const datosHogar = getDatosHogarByIndex(hogarIndex);
          const contacto = Number.isInteger(contactoIndex)
            ? datosHogar?.contactos[contactoIndex]
            : null;

          return {
            sectionId: 'datos-por-hogar',
            selector:
              contacto && contactoField === 'telefono'
                ? buildIdSelector(`telefono-contacto-${contacto.id}`)
                : contactosCardSelector,
            fallbackSelector: contactosCardSelector,
            hogarIndex,
          };
        }
      }
    }

    if (campo === 'personas.documentosDuplicados') {
      return {
        sectionId: 'datos-por-hogar',
        selector:
          hogares.length > 0
            ? buildHogarCardSelector(0, 'personas')
            : buildDataValidationCardSelector('datos-por-hogar'),
        fallbackSelector: hogares.length > 0 ? buildDataValidationHogarSelector(0) : undefined,
        hogarIndex: hogares.length > 0 ? 0 : undefined,
      };
    }

    if (campo === 'cierre.latitud') {
      return { sectionId: 'cierre-finalizacion', selector: buildIdSelector('latitud-a-confirmar') };
    }

    if (campo === 'cierre.longitud') {
      return { sectionId: 'cierre-finalizacion', selector: buildIdSelector('longitud-a-confirmar') };
    }

    if (campo === 'cierre.horaCaptura') {
      return { sectionId: 'cierre-finalizacion', selector: buildIdSelector('hora-captura-a-confirmar') };
    }

    if (normalizedCampo.startsWith('cierre')) {
      return { sectionId: 'cierre-finalizacion', selector: buildIdSelector('observaciones-generales') };
    }

    return {
      sectionId: currentSection.id,
      selector: buildDataValidationCardSelector(campo),
    };
  };

  const focusValidationTarget = (target: ValidationFocusTarget) => {
    const delay =
      typeof target.hogarIndex === 'number'
        ? 360
        : target.sectionId === currentSection.id
          ? 120
          : 300;

    window.setTimeout(() => {
      const targetElement =
        document.querySelector<HTMLElement>(target.selector) ??
        (target.fallbackSelector
          ? document.querySelector<HTMLElement>(target.fallbackSelector)
          : null);

      if (!targetElement) {
        scrollToSectionStepper();
        return;
      }

      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const focusableElement = targetElement.matches(
        'input, select, textarea, button, [tabindex]',
      )
        ? targetElement
        : targetElement.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );

      focusableElement?.focus({ preventScroll: true });
    }, delay);
  };

  const handleIrASeccionValidacion = (error: FinalizacionValidationError) => {
    const target = getValidationFocusTarget(error.campo);

    if (typeof target.hogarIndex === 'number') {
      setValidationFocusRequest({
        campo: error.campo,
        requestId: Date.now(),
      });
    }

    setCurrentSectionId(target.sectionId);
    focusValidationTarget(target);
  };

  const validateDocumentosRegistradosBackend = async (): Promise<FinalizacionValidationError[]> => {
    if (getRelevamientoFinalizationMode() !== 'backend') {
      return [];
    }

    const errors: FinalizacionValidationError[] = [];
    const documentosConsultados = new Map<string, boolean>();

    for (const [hogarIndex, hogar] of hogares.entries()) {
      const personas = personasContactosPorHogar[hogar.id]?.personas ?? [];

      for (const [personaIndex, persona] of personas.entries()) {
        const documento = persona.cedula.trim();

        if (!documento) {
          continue;
        }

        const documentoKey = documento.toLowerCase();
        let documentoRegistrado = documentosConsultados.get(documentoKey);

        if (documentoRegistrado === undefined) {
          documentoRegistrado = await consultarPersonaPorDocumento(documento);
          documentosConsultados.set(documentoKey, documentoRegistrado);
        }

        if (documentoRegistrado) {
          errors.push({
            campo: `hogares.${hogarIndex}.personas.${personaIndex}.cedula`,
            mensaje: DOCUMENTO_REGISTRADO_MESSAGE,
          });
        }
      }
    }

    return errors;
  };

  const ensureDocumentosRegistradosBeforeClosure = async () => {
    const documentosRegistradosBackendErrors = await validateDocumentosRegistradosBackend();

    if (documentosRegistradosBackendErrors.length === 0) {
      return true;
    }

    setSectionValidationErrors(documentosRegistradosBackendErrors);
    setFinalizationValidationErrors([]);
    setFinalizationError('');
    persistLocalDraft();
    scrollToSectionValidationAlert();

    return false;
  };

  const finalizarRelevamiento = async () => {
    setFinalizationError('');

    if (hayHogaresNoEntrevistados(hogares)) {
      persistLocalDraft();
      setShowHogaresPendientesFinalizacionModal(true);
      return;
    }

    const validation = validateFinalizacionRelevamiento(
      buildBackendSnapshot('cierre-finalizacion'),
    );

    if (!validation.valid) {
      setFinalizationValidationErrors(validation.errors);
      setSectionValidationErrors([]);
      return;
    }

    const documentosRegistradosBackendErrors = await validateDocumentosRegistradosBackend();

    if (documentosRegistradosBackendErrors.length > 0) {
      setFinalizationValidationErrors(documentosRegistradosBackendErrors);
      setSectionValidationErrors([]);
      persistLocalDraft();
      return;
    }

    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    persistLocalDraft();

    try {
      const result = await finalizarRelevamientoBackend(
        buildBackendSnapshot('cierre-finalizacion'),
        serverDraftId,
        serverDraftVersion,
      );

      if (result.mode === 'backend') {
        setServerDraftId(result.borradorId ?? null);
        setServerDraftVersion(result.draftVersion ?? null);
        setServerDraftLastSyncedAt(new Date().toISOString());
        setServerDraftSyncStatus('SINCRONIZADO');
        setServerDraftSyncError('');
      }

      resetRelevamiento();
      setFinalizacionCompletada(true);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo guardar la información en el servidor. Verifique la conexión e intente nuevamente.';
      const backendValidationErrors = buildBackendValidationErrors(error);

      if (backendValidationErrors.length > 0) {
        setFinalizationValidationErrors(backendValidationErrors);
        setSectionValidationErrors([]);
        setFinalizationError('');
        setServerDraftSyncStatus('ERROR_SINCRONIZACION');
        setServerDraftSyncError(message);
        saveLocalDraft(
          buildLocalDraft({
            serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
            serverDraftSyncError: message,
          }),
        );
        return;
      }

      setFinalizationError(message);
      setServerDraftSyncStatus('ERROR_SINCRONIZACION');
      setServerDraftSyncError(message);
      saveLocalDraft(
        buildLocalDraft({
          serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
          serverDraftSyncError: message,
        }),
      );
    }
  };

  const handleFinalizarRelevamiento = async () => {
    if (isFinalizing || isCheckingServerDraftBeforeAdvance) {
      return;
    }

    if (hayHogaresNoEntrevistados(hogares)) {
      persistLocalDraft();
      setFinalizationValidationErrors([]);
      setSectionValidationErrors([]);
      setFinalizationError('');
      setShowHogaresPendientesFinalizacionModal(true);
      return;
    }

    const validation = validateFinalizacionRelevamiento(
      buildBackendSnapshot('cierre-finalizacion'),
    );

    if (!validation.valid) {
      setFinalizationValidationErrors(validation.errors);
      setSectionValidationErrors([]);
      setFinalizationError('');

      if (hayHogaresNoEntrevistados(hogares)) {
        persistLocalDraft();
      }

      return;
    }

    const canFinalize = await ensureServerDraftBeforeLeavingInitialSection(
      'cierre-finalizacion',
    );

    if (!canFinalize) {
      return;
    }

    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setPendingConfirmAction({ type: 'finalize-relevamiento' });
  };

  const isSectionDisabled = () => false;

  const selectSection = async (sectionId: RelevamientoSectionId) => {
    const nextSection = sections.find((section) => section.id === sectionId);

    if (!nextSection) {
      return;
    }

    if (nextSection.order <= currentSection.order) {
      setSectionValidationErrors([]);
      setCurrentSectionId(sectionId);
      markDraftPending();
      return;
    }

    const validation = validateSectionsBeforeNavigation(sectionId);

    if (!validation.valid) {
      setSectionValidationErrors(validation.errors);
      setFinalizationValidationErrors([]);
      setFinalizationError('');
      scrollToSectionValidationAlert();
      return;
    }

    if (sectionId === 'cierre-finalizacion') {
      const canEnterClosure = await ensureDocumentosRegistradosBeforeClosure();

      if (!canEnterClosure) {
        return;
      }
    }

    setSectionValidationErrors([]);
    setCurrentSectionId(sectionId);
    markDraftPending();
  };

  const scrollToSectionStepper = () => {
    requestAnimationFrame(() => {
      sectionStepperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const scrollToSectionValidationAlert = () => {
    requestAnimationFrame(() => {
      sectionValidationAlertRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    setSectionValidationErrors([]);
    setCurrentSectionId(sections[currentIndex - 1].id);
    markDraftPending();
  };

  const goForward = async () => {
    if (!canGoForward || isCheckingServerDraftBeforeAdvance) {
      return;
    }

    const validation = validateCurrentSectionBeforeAdvance();

    if (!validation.valid) {
      setSectionValidationErrors(validation.errors);
      setFinalizationValidationErrors([]);
      setFinalizationError('');
      scrollToSectionValidationAlert();
      return;
    }

    setSectionValidationErrors([]);

    const nextSectionId = sections[currentIndex + 1].id;
    const shouldRunBlockingServerDraftValidation =
      shouldValidateServerDraftBeforeLeavingInitialSection();
    const canAdvance = await ensureServerDraftBeforeLeavingInitialSection(nextSectionId);

    if (!canAdvance) {
      return;
    }

    if (nextSectionId === 'cierre-finalizacion') {
      const canEnterClosure = await ensureDocumentosRegistradosBeforeClosure();

      if (!canEnterClosure) {
        return;
      }
    }

    persistLocalDraft({ currentSectionId: nextSectionId });
    setCurrentSectionId(nextSectionId);
    setFinalizacionCompletada(false);

    if (!shouldRunBlockingServerDraftValidation) {
      void syncServerDraftNoBloqueante(buildBackendSnapshot(nextSectionId));
    }

    scrollToSectionStepper();
  };

  return (
    <Stack gap={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={8}>
              <h1 className="h2 mb-2">Formulario de relevamiento</h1>
              <p className="text-secondary mb-0">
                Complete el relevamiento por secciones. La carga conserva un borrador local en
                esta tablet durante el uso del formulario.
              </p>
            </Col>

            <Col lg={4}>
              <Alert variant={visitaTieneCorteTemprano ? 'warning' : 'info'} className="mb-0">
                <div className="d-flex flex-column gap-1">
                  <span>
                    Sección actual: <strong>{currentSection.order}</strong>
                  </span>
                  <span>
                    Guardado local: <strong>{localDraftStatusLabel[draftStatus]}</strong>
                  </span>
                  {getRelevamientoFinalizationMode() === 'backend' ? (
                    <span>
                      Servidor: <strong>{serverDraftSyncStatusLabel[serverDraftSyncStatus]}</strong>
                    </span>
                  ) : null}
                  {lastSavedAt ? (
                    <span className="small">
                      Último guardado: <strong>{formatSavedAt(lastSavedAt)}</strong>
                    </span>
                  ) : null}
                </div>
              </Alert>

              <div className="d-grid mt-3">
                <Button
                  variant="outline-primary"
                  onClick={() => setShowCuadranteImageModal(true)}
                  disabled={!selectedCuadrante}
                >
                  Ver imagen del cuadrante
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div ref={sectionStepperRef}>
        <Alert variant="light" className="border shadow-sm mb-0">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
            <div>
              <strong>Predio actual:</strong> {predioActualLabel}
            </div>
            <div className="text-secondary">
              <strong>Cuadrante:</strong> {cuadranteActualLabel}
            </div>
          </div>
        </Alert>

      {localDraftsIndex.length > 0 && getRelevamientoFinalizationMode() !== 'backend' ? (
        <Alert variant="light" className="border shadow-sm mb-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <strong>Hay cargas guardadas en esta tablet.</strong>{' '}
              <span className="text-secondary">
                Podés revisarlas sin ocupar espacio en la pantalla principal.
              </span>
            </div>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowLocalDraftsModal(true)}
            >
              Ver cargas guardadas
            </Button>
          </div>
        </Alert>
      ) : null}

      {getRelevamientoFinalizationMode() === 'backend' ? (
        <Alert variant="light" className="border shadow-sm mb-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <strong>Borradores servidor pendientes.</strong>{' '}
              <span className="text-secondary">
                {serverDraftsLoading
                  ? 'Consultando servidor...'
                  : serverDrafts.length > 0
                    ? `Hay ${serverDrafts.length} pendiente(s) para esta tablet.`
                    : 'Consultá el respaldo servidor de cargas no finalizadas.'}
              </span>
            </div>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={handleOpenServerDraftsModal}
            >
              Ver borradores servidor
            </Button>
          </div>
        </Alert>
      ) : null}

      <Modal
        show={showLocalDraftsModal}
        onHide={() => setShowLocalDraftsModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Borradores locales de esta tablet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Esta recuperación es local. No permite retomar la carga desde otra tablet ni si se
            borra el almacenamiento del navegador.
          </Alert>

          <BorradoresLocalesList
            drafts={localDraftsIndex}
            activeDraftKey={activeLocalDraftKey}
            onRetomar={requestRetomarLocalDraftByKey}
            onDescartar={handleDescartarLocalDraftByKey}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={showServerDraftsModal}
        onHide={() => setShowServerDraftsModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Borradores servidor pendientes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            <Alert variant="info" className="mb-0">
              Esta recuperación usa el borrador guardado en servidor. Al retomarlo se conserva una
              copia local en esta tablet para continuar la carga.
            </Alert>

            {serverDraftsError ? (
              <Alert variant="warning" className="mb-0">
                {serverDraftsError}
              </Alert>
            ) : null}

            <BorradoresServidorList
              drafts={serverDrafts}
              isLoading={serverDraftsLoading}
              onRetomar={requestRetomarServerDraft}
            />
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowServerDraftsModal(false)}>
            Cerrar
          </Button>
          <Button variant="outline-primary" onClick={() => void refreshServerDrafts()}>
            Actualizar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showServerDraftForPredioModal}
        onHide={handleContinueWithoutServerDraftForPredio}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {pendingDraftSourceForPredio === 'local'
              ? 'Carga pendiente local detectada'
              : 'Carga pendiente detectada'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            {pendingDraftSourceForPredio === 'local' ? (
              <>
                {serverDraftForPredioError ? (
                  <Alert variant="warning" className="mb-0">
                    {serverDraftForPredioError}
                  </Alert>
                ) : null}

                <Alert variant="info" className="mb-0">
                  Hay un respaldo local en esta tablet para este predio. Podés retomarlo para
                  continuar trabajando.
                </Alert>

                {hasInitialChangeRiskData ? (
                  <Alert variant="warning" className="mb-0">
                    Ya hay datos cargados en el formulario actual. Si retomás la carga pendiente,
                    se reemplazará lo que estás viendo ahora.
                  </Alert>
                ) : null}
              </>
            ) : (
              <>
                <Alert variant="info" className="mb-0">
                  Se encontró una carga pendiente para este predio. Te recomendamos retomarla para
                  continuar desde el último guardado.
                </Alert>

                <p className="text-secondary small mb-0">Origen: servidor.</p>

                {hasInitialChangeRiskData ? (
                  <Alert variant="warning" className="mb-0">
                    Ya hay datos cargados en el formulario actual. Si retomás la carga pendiente,
                    se reemplazará lo que estás viendo ahora.
                  </Alert>
                ) : null}

                <BorradoresServidorList
                  drafts={serverDraftsForSelectedPredio}
                  isLoading={false}
                  onRetomar={requestRetomarServerDraft}
                />
              </>
            )}
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleContinueWithoutServerDraftForPredio}>
            Continuar sin retomar
          </Button>
          {pendingDraftSourceForPredio === 'local' ? (
            <Button variant="primary" onClick={handleRetomarLocalFallbackForPredio}>
              Retomar carga pendiente
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>

      <Modal
        show={Boolean(serverDraftToRetomar)}
        onHide={handleCancelRetomarServerDraft}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Retomar carga pendiente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            <p className="mb-0">
              Se cargará la carga pendiente #{serverDraftToRetomar?.id} y se reemplazará la
              información que esté abierta actualmente en el formulario.
            </p>

            <Alert variant="warning" className="mb-0">
              Si continuás, el formulario quedará asociado al mismo borrador servidor para seguir
              sincronizando sobre ese identificador.
            </Alert>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCancelRetomarServerDraft}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmRetomarServerDraft}>
            Retomar carga pendiente
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={Boolean(localDraftToRetomar)}
        onHide={handleCancelRetomarLocalDraft}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Retomar carga local</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            <p className="mb-0">
              Se cargará el borrador guardado para este predio y se reemplazará la información que
              esté abierta actualmente en el formulario.
            </p>

            {localDraftToRetomar ? (
              <div className="text-secondary">
                <div>
                  Predio:{' '}
                  <strong>{getLocalDraftPredioDisplayLabel(localDraftToRetomar)}</strong>
                </div>
                {getLocalDraftPredioDoorNumber(localDraftToRetomar) ? (
                  <div>
                    Número de puerta: {getLocalDraftPredioDoorNumber(localDraftToRetomar)}
                  </div>
                ) : null}
                <div>Guardado: {formatSavedAt(localDraftToRetomar.savedAt)}</div>
                <div>
                  Sección:{' '}
                  {getLocalDraftSectionLabel(localDraftToRetomar.currentSectionId)}
                </div>
                <div>Hogares cargados: {localDraftToRetomar.cantidadHogares}</div>
              </div>
            ) : null}

            <Alert variant="warning" className="mb-0">
              Si continuás, se reemplazará la carga que esté abierta actualmente en pantalla por
              este borrador local.
            </Alert>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCancelRetomarLocalDraft}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmRetomarLocalDraft}>
            Retomar carga
          </Button>
        </Modal.Footer>
      </Modal>

      <SectionStepper
          sections={sections}
          currentSectionId={currentSection.id}
          onSelectSection={selectSection}
          isSectionDisabled={isSectionDisabled}
        />
      </div>

      <Modal show={showPredioYaRelevadoModal} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>Este predio ya fue relevado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            No se puede iniciar una nueva carga para este predio porque el sistema informó
            que ya existe una carga asociada.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleLimpiarPredioYaRelevado}>
            Limpiar formulario
          </Button>
        </Modal.Footer>
      </Modal>

      <SectionPlaceholder section={currentSection}>
        {currentSection.id === 'inicio-predio-visita' ? (
          <Stack gap={3}>
            <Card className="border-0 bg-light">
              <Card.Body>
                <p className="text-uppercase text-secondary fw-semibold small mb-2">
                  Información institucional del operativo
                </p>
                <h3 className="h5 mb-2">
                  Propuesta de relevamiento Boix y Merino – 2026 (revisado Convivencia y DDSS)
                </h3>
                <p className="text-secondary mb-0">
                  Desde la última asignación de viviendas por realojos y por regularizaciones
                  (2012), pasó un tiempo considerable, por lo que es clave conocer cómo ha
                  evolucionado la integración familiar de las casas del barrio, para esto tener
                  una foto de las familias y las casas es vital. Para actualizar la información
                  es necesario conocer la situación actual a través del presente cuestionario. La
                  IM está trabajando en la re-activación del proceso de regularización del
                  barrio, con el objetivo de avanzar en el proceso de regularización.
                </p>
              </Card.Body>
            </Card>

            <TerritorialSelector
              key={territorialSelectorKey}
              selectedPredioId={selectedPredioId}
              selectedPredio={selectedPredio}
              selectedCuadrante={selectedCuadrante}
              onPredioSelected={handlePredioSelected}
              onCuadranteSelected={handleCuadranteSelected}
              onRequestTerritorialChange={requestTerritorialChange}
            />

            {selectedPredio ? (
              <>
                <ResultadoVisitaSelector
                  value={resultadoVisita}
                  onChange={handleResultadoVisitaChange}
                />

                {visitaTieneCorteTemprano ? (
                  <CierreRelevamientoSection
                    modo="corte-temprano"
                    cierre={cierre}
                    selectedPredio={selectedPredio}
                    resultadoVisita={resultadoVisita}
                    vivienda={vivienda}
                    hogares={hogares}
                    personasContactosPorHogar={personasContactosPorHogar}
                    finalizacionCompletada={finalizacionCompletada}
                    onCierreChange={handleCierreChange}
                    onFinalizarRelevamiento={handleFinalizarRelevamiento}
                  />
                ) : null}
              </>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Seleccioná un predio para habilitar el resultado de visita.
              </Alert>
            )}
          </Stack>
        ) : null}

        {currentSection.id === 'vivienda-hogares' ? (
          <ViviendaHogaresSection
            vivienda={vivienda}
            hogares={hogares}
            onViviendaChange={handleViviendaChange}
            onAddHogar={addHogar}
            onUpdateHogar={updateHogar}
            onRemoveHogar={requestRemoveHogar}
          />
        ) : null}

        {currentSection.id === 'datos-por-hogar' ? (
          <PersonasContactosSection
              hogares={hogares}
              personasContactosPorHogar={personasContactosPorHogar}
              validationFocusRequest={validationFocusRequest}
              onChange={handlePersonasContactosChange}
            />
        ) : null}

        {currentSection.id === 'cierre-finalizacion' ? (
          <CierreRelevamientoSection
            cierre={cierre}
            selectedPredio={selectedPredio}
            resultadoVisita={resultadoVisita}
            vivienda={vivienda}
            hogares={hogares}
            personasContactosPorHogar={personasContactosPorHogar}
            finalizacionCompletada={finalizacionCompletada}
            onCierreChange={handleCierreChange}
            onFinalizarRelevamiento={handleFinalizarRelevamiento}
          />
        ) : null}
      </SectionPlaceholder>

      {isFinalizing ? (
        <Alert variant="info" className="mb-0">
          Guardando información...
        </Alert>
      ) : null}

      {sectionValidationErrors.length > 0 ? (
        <div ref={sectionValidationAlertRef}>
          <Alert variant="warning" className="mb-0">
            <div className="fw-semibold mb-2">
              Antes de avanzar, revise los siguientes datos:
            </div>
            <ul className="mb-0">
              {sectionValidationErrors.map((error) => (
                <li key={`${error.campo}-${error.mensaje}`} className="mb-2">
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                    <span>{error.mensaje}</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 align-self-start"
                      onClick={() => handleIrASeccionValidacion(error)}
                    >
                      Ir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      {finalizationValidationErrors.length > 0 ? (
        <Alert variant="warning" className="mb-0">
          <div className="fw-semibold mb-2">
            Antes de finalizar, revise los siguientes datos:
          </div>
          <ul className="mb-0">
            {finalizationValidationErrors.map((error) => (
                      <li key={`${error.campo}-${error.mensaje}`} className="mb-2">
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                          <span>{error.mensaje}</span>
                          {error.campo !== 'backend' ? (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="p-0 align-self-start"
                              onClick={() => handleIrASeccionValidacion(error)}
                            >
                              Ir
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
          </ul>
        </Alert>
      ) : null}

      {finalizationError ? (
        <Alert variant="danger" className="mb-0">
              {finalizationError}
            </Alert>
      ) : null}

      {currentSection.id === 'vivienda-hogares' && !cantidadHogaresCoincide ? (
        <Alert variant="warning" className="mb-0">
          La cantidad de hogares cargados debe coincidir con la cantidad declarada para continuar.
        </Alert>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <Button variant="outline-secondary" onClick={goBack} disabled={!canGoBack}>
              Retroceder
            </Button>

            <div className="text-center text-secondary">
              Siguiente paso: <strong>{nextSectionTitle}</strong>
            </div>

            <Button variant="primary" onClick={goForward} disabled={!canGoForward}>
              Avanzar
            </Button>
          </div>
        </Card.Body>
      </Card>

      <CuadranteImageModal
        show={showCuadranteImageModal}
        cuadrante={selectedCuadrante}
        onHide={() => setShowCuadranteImageModal(false)}
      />

      <Modal
        show={showHogaresPendientesFinalizacionModal}
        onHide={handleGuardarBorradorHogaresPendientes}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">Antes de finalizar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            <p className="mb-0 fw-semibold">
              Antes de finalizar, revise los siguientes datos:
            </p>

            <Alert variant="warning" className="mb-0">
              El relevamiento tiene hogares pendientes o no entrevistados.
              <br />
              La carga quedará guardada como borrador para retomarla luego.
            </Alert>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={handleGuardarBorradorHogaresPendientes}
          >
            Guardar borrador
          </Button>
          <Button variant="primary" onClick={handleIrSeccionHogaresPendientes}>
            Ir a la sección 2
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showBorradorPendienteGuardadoModal}
        onHide={() => setShowBorradorPendienteGuardadoModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">Borrador guardado</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-2">Borrador guardado correctamente.</p>
          <p className="mb-0">
            La carga quedó disponible en “Borradores locales de esta tablet” para retomarla luego.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowBorradorPendienteGuardadoModal(false)}
          >
            Aceptar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={finalizacionCompletada}
        onHide={() => setFinalizacionCompletada(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">Relevamiento finalizado</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Información guardada correctamente.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => setFinalizacionCompletada(false)}>
            Aceptar
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmActionModal
        show={Boolean(confirmActionContent)}
        title={confirmActionContent?.title ?? ''}
        message={confirmActionContent?.message ?? ''}
        confirmLabel={confirmActionContent?.confirmLabel}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmPendingAction}
        onCancel={cancelConfirmAction}
      />
    </Stack>
  );
}
