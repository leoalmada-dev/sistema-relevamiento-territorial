import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Modal, Row, Stack } from 'react-bootstrap';
import { BorradoresLocalesList } from '../components/BorradoresLocalesList';
import { CierreRelevamientoSection } from '../components/CierreRelevamientoSection';
import { CuadranteImageModal } from '../components/CuadranteImageModal';
import { PersonasContactosSection } from '../components/PersonasContactosSection';
import { ResultadoVisitaSelector } from '../components/ResultadoVisitaSelector';
import { SectionPlaceholder } from '../components/SectionPlaceholder';
import { SectionStepper } from '../components/SectionStepper';
import { TerritorialSelector } from '../components/TerritorialSelector';
import { ViviendaHogaresSection } from '../components/ViviendaHogaresSection';
import { ConfirmActionModal } from '../../../shared/components/ConfirmActionModal';
import {
  buildLocalDraftKey,
  clearLocalDraft,
  getLocalDraft,
  getLocalDraftByKey,
  getLocalDraftPredioDisplayLabel,
  getLocalDraftPredioDoorNumber,
  getLocalDraftsIndex,
  removeLocalDraftByKey,
  saveLocalDraft,
} from '../services/draftStorageService';
import {
  finalizarRelevamientoBackend,
  getRelevamientoFinalizationMode,
  guardarBorradorServidor,
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
  viviendaInicial,
  type HogarFormState,
  type ViviendaFormState,
} from '../types/viviendaHogar';

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
  const [localDraftToRecover, setLocalDraftToRecover] =
    useState<RelevamientoLocalDraftIndexItem | null>(null);
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
    Number.isFinite(cantidadHogaresDeclarada) && cantidadHogaresDeclarada > 0;
  const cantidadHogaresCoincide =
    cantidadHogaresDeclaradaValida && cantidadHogaresDeclarada === hogares.length;

  const activeLocalDraftKey = buildLocalDraftKey({
    selectedPredioId,
    selectedPredio,
    selectedCuadrante,
  });

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

  useEffect(() => {
    refreshLocalDraftsIndex();
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
    setDraftStatus('CAMBIOS_PENDIENTES');
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
    setCurrentSectionId(draft.currentSectionId);
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
    setLastSavedAt(draft.savedAt);
    setPendingLocalDraft(null);
    setDraftStatus('BORRADOR_RECUPERADO');
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

  const maybeOfferLocalDraftRecovery = (
    nextSelectedPredioId: string,
    nextSelectedPredio: PredioDetalle | null,
  ) => {
    if (!nextSelectedPredio) {
      return false;
    }

    const nextDraftKey = buildLocalDraftKey({
      selectedPredioId: nextSelectedPredioId,
      selectedPredio: nextSelectedPredio,
      selectedCuadrante,
    });

    if (!nextDraftKey || activeLocalDraftKey === nextDraftKey) {
      return false;
    }

    const savedDraft = getLocalDraftByKey(nextDraftKey);
    const nextIndex = getLocalDraftsIndex();
    const existingDraft = nextIndex.find((draft) => draft.draftKey === nextDraftKey);
    setLocalDraftsIndex(nextIndex);

    if (existingDraft && savedDraft) {
      setLocalDraftToRecover(existingDraft);
      return true;
    }

    return false;
  };

  const handleRecoverSelectedPredioDraft = () => {
    if (!localDraftToRecover) {
      return;
    }

    handleRetomarLocalDraftByKey(localDraftToRecover.draftKey);
    setLocalDraftToRecover(null);
  };

  const handleCancelSelectedPredioDraftRecovery = () => {
    setLocalDraftToRecover(null);
    setTerritorialSelectorKey((currentKey) => currentKey + 1);
  };

  const handleCuadranteSelected = (cuadrante: CuadranteOption | null) => {
    setSelectedCuadrante(cuadrante);

    if (!cuadrante) {
      setShowCuadranteImageModal(false);
    }
  };

  const handlePredioSelected = (predioId: string, predioDetalle: PredioDetalle | null) => {
    if (maybeOfferLocalDraftRecovery(predioId, predioDetalle)) {
      return;
    }

    const isSamePredio = predioId === selectedPredioId;

    setSelectedPredioId(predioId);
    setSelectedPredio(predioDetalle);

    if (isSamePredio) {
      markDraftPending();
      return;
    }

    setResultadoVisita(resultadoVisitaInicial);
    resetViviendaHogares();
    setCurrentSectionId('inicio-predio-visita');
    markDraftPending();
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
    const requiresCutoffConfirmation =
      !permiteContinuarFormulario(nextResultado.resultado) && hasPostVisitData;

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

      setServerDraftSyncStatus('ERROR_SINCRONIZACION');
      setServerDraftSyncError(message);

      persistServerMetadataLocally({
        currentSectionId: snapshot.currentSectionId,
        serverDraftSyncStatus: 'ERROR_SINCRONIZACION',
        serverDraftSyncError: message,
      });
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

  const finalizarRelevamiento = async () => {
    setFinalizationError('');

    const validation = validateFinalizacionRelevamiento(
      buildBackendSnapshot('cierre-finalizacion'),
    );

    if (!validation.valid) {
      setFinalizationValidationErrors(validation.errors);
      setSectionValidationErrors([]);
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

  const handleFinalizarRelevamiento = () => {
    if (isFinalizing) {
      return;
    }

    const validation = validateFinalizacionRelevamiento(
      buildBackendSnapshot('cierre-finalizacion'),
    );

    if (!validation.valid) {
      setFinalizationValidationErrors(validation.errors);
      setSectionValidationErrors([]);
      setFinalizationError('');
      return;
    }

    setFinalizationValidationErrors([]);
    setSectionValidationErrors([]);
    setPendingConfirmAction({ type: 'finalize-relevamiento' });
  };

  const isSectionDisabled = () => false;

  const selectSection = (sectionId: RelevamientoSectionId) => {
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

  const goForward = () => {
    if (!canGoForward) {
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
    persistLocalDraft({ currentSectionId: nextSectionId });
    setCurrentSectionId(nextSectionId);
    setFinalizacionCompletada(false);
    void syncServerDraftNoBloqueante(buildBackendSnapshot(nextSectionId));
    scrollToSectionStepper();
  };

  return (
    <Stack gap={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={8}>
              <p className="text-uppercase text-secondary fw-semibold small mb-2">
                Guardado automáticamente
              </p>
              <h1 className="h2 mb-2">Formulario de relevamiento</h1>
              <p className="text-secondary mb-0">
                Complete el relevamiento por secciones. La información se guarda automáticamente
                en este dispositivo durante la carga.
              </p>
            </Col>

            <Col lg={4}>
              <Alert variant={visitaTieneCorteTemprano ? 'warning' : 'info'} className="mb-0">
                <div className="d-flex flex-column gap-1">
                  <span>
                    Sección actual: <strong>{currentSection.order}</strong>
                  </span>
                  <span>
                    Estado: <strong>{localDraftStatusLabel[draftStatus]}</strong>
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

      {pendingLocalDraft ? (
        <Alert variant="info" className="mb-0 shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              Hay información guardada disponible del{' '}
              <strong>{formatSavedAt(pendingLocalDraft.savedAt)}</strong>.
              Podés continuar la carga o descartarla.
            </div>

            <div className="d-flex flex-column flex-md-row gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => applyLocalDraft(pendingLocalDraft)}
              >
                Continuar carga
              </Button>
              <Button variant="outline-danger" size="sm" onClick={requestDiscardLocalDraft}>
                Descartar información guardada
              </Button>
            </div>
          </div>
        </Alert>
      ) : null}

      <div ref={sectionStepperRef}>
      {localDraftsIndex.length > 0 ? (
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
            onRetomar={(draftKey) => {
              handleRetomarLocalDraftByKey(draftKey);
              setShowLocalDraftsModal(false);
            }}
            onDescartar={handleDescartarLocalDraftByKey}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={Boolean(localDraftToRecover)}
        onHide={handleCancelSelectedPredioDraftRecovery}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Ya existe una carga local para este predio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={3}>
            <p className="mb-0">
              Hay un borrador guardado en esta tablet para: <br />
              <strong>
                {localDraftToRecover ? getLocalDraftPredioDisplayLabel(localDraftToRecover) : ''}
              </strong>
            </p>

            {localDraftToRecover ? (
              <div className="text-secondary">
                {getLocalDraftPredioDoorNumber(localDraftToRecover) ? (
                  <div>
                    Número de puerta:{' '}
                    {getLocalDraftPredioDoorNumber(localDraftToRecover)}
                  </div>
                ) : null}
                <div>Guardado: {formatSavedAt(localDraftToRecover.savedAt)}</div>
                <div>
                  Sección:{' '}
                  {getLocalDraftSectionLabel(localDraftToRecover.currentSectionId)}
                </div>
                <div>Hogares cargados: {localDraftToRecover.cantidadHogares}</div>
              </div>
            ) : null}

            <Alert variant="warning" className="mb-0">
              Si continuás cargando este predio sin recuperar el borrador, podrías reemplazar la
              carga local guardada para este mismo predio.
            </Alert>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCancelSelectedPredioDraftRecovery}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleRecoverSelectedPredioDraft}>
            Recuperar carga
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
                <li key={`${error.campo}-${error.mensaje}`}>{error.mensaje}</li>
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
              <li key={`${error.campo}-${error.mensaje}`}>{error.mensaje}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {finalizationError ? (
        <Alert variant="danger" className="mb-0">
          No se pudo guardar la información. Verifique la conexión e intente nuevamente.
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
