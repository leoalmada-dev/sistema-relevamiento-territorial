import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Stack } from 'react-bootstrap';
import { CierreRelevamientoSection } from '../components/CierreRelevamientoSection';
import { PersonasContactosSection } from '../components/PersonasContactosSection';
import { ResultadoVisitaSelector } from '../components/ResultadoVisitaSelector';
import { SectionPlaceholder } from '../components/SectionPlaceholder';
import { SectionStepper } from '../components/SectionStepper';
import { TerritorialSelector } from '../components/TerritorialSelector';
import { ViviendaHogaresSection } from '../components/ViviendaHogaresSection';
import {
  clearLocalDraft,
  getLocalDraft,
  hasLocalDraft,
  LOCAL_DRAFT_STORAGE_KEY,
  saveLocalDraft,
} from '../services/draftStorageService';
import {
  cierreRelevamientoInicial,
  type CierreRelevamientoFormState,
} from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import {
  localDraftStatusLabel,
  type LocalDraftStatus,
  type RelevamientoLocalDraft,
} from '../types/relevamientoDraft';
import {
  esCorteTemprano,
  permiteContinuarFormulario,
  resultadoVisitaInicial,
  type ResultadoVisitaFormState,
} from '../types/resultadoVisita';
import type { RelevamientoSection, RelevamientoSectionId } from '../types/relevamientoFlow';
import type { PredioDetalle } from '../types/territorio';
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
      'Punto de entrada del relevamiento. Define si la entrevista continúa o si aplica corte temprano.',
    includes: [
      'Selección de zona, cuadrante y predio con mocks locales.',
      'Visualización de datos precargados del predio.',
      'Resultado de visita con corte temprano visual.',
      'Sin creación real de relevamiento todavía.',
    ],
  },
  {
    id: 'vivienda-hogares',
    order: 2,
    title: 'Vivienda y hogares',
    description:
      'Sección temporal para datos generales de vivienda y gestión de varios hogares dentro del predio.',
    includes: [
      'Cantidad de hogares declarada.',
      'Vínculo entre hogares.',
      'Observaciones de vivienda.',
      'Agregar, editar, listar y eliminar hogares en memoria React.',
    ],
  },
  {
    id: 'datos-por-hogar',
    order: 3,
    title: 'Personas, contactos, servicios y salud por hogar',
    description:
      'Sección temporal para personas, contactos, servicios y salud por hogar.',
    includes: [
      'Seleccionar hogar cargado en Sección 2.',
      'Agregar, editar, listar y eliminar personas por hogar.',
      'Agregar, editar, listar y eliminar contactos por hogar.',
      'Servicios y salud por hogar en memoria React.',
    ],
  },
  {
    id: 'cierre-finalizacion',
    order: 4,
    title: 'Observaciones, coordenadas y finalización',
    description:
      'Cierre visual del relevamiento con observaciones generales, coordenadas placeholder y revisión final.',
    includes: [
      'Observaciones generales del relevamiento.',
      'Coordenadas placeholder asociadas al relevamiento completo.',
      'Revisión final visual.',
      'Finalización simulada sin guardado real.',
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

export function RelevamientoFlowPage() {
  const [currentSectionId, setCurrentSectionId] =
    useState<RelevamientoSectionId>('inicio-predio-visita');
  const [selectedPredioId, setSelectedPredioId] = useState('');
  const [selectedPredio, setSelectedPredio] = useState<PredioDetalle | null>(null);
  const [resultadoVisita, setResultadoVisita] =
    useState<ResultadoVisitaFormState>(resultadoVisitaInicial);
  const [vivienda, setVivienda] = useState<ViviendaFormState>(viviendaInicial);
  const [hogares, setHogares] = useState<HogarFormState[]>([]);
  const [personasContactosPorHogar, setPersonasContactosPorHogar] =
    useState<PersonasContactosPorHogarState>({});
  const [cierre, setCierre] =
    useState<CierreRelevamientoFormState>(cierreRelevamientoInicial);
  const [finalizacionSimulada, setFinalizacionSimulada] = useState(false);
  const [pendingLocalDraft, setPendingLocalDraft] =
    useState<RelevamientoLocalDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<LocalDraftStatus>('SIN_BORRADOR');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [draftRecoveryChecked, setDraftRecoveryChecked] = useState(false);

  const currentIndex = sections.findIndex((section) => section.id === currentSectionId);
  const currentSection = sections[currentIndex] ?? sections[0];

  const visitaPermiteContinuar = permiteContinuarFormulario(resultadoVisita.resultado);
  const visitaTieneCorteTemprano = esCorteTemprano(resultadoVisita.resultado);
  const seccionInicialCompleta = Boolean(selectedPredio) && visitaPermiteContinuar;

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

  const canGoBack = currentIndex > 0;
  const canGoForward =
    currentIndex < sections.length - 1 &&
    (currentSection.id !== 'inicio-predio-visita' || seccionInicialCompleta);

  const nextSectionTitle = useMemo(() => {
    if (currentSection.id === 'inicio-predio-visita' && visitaTieneCorteTemprano) {
      return 'Corte temprano';
    }

    if (!canGoForward) {
      return 'Completar Sección 1';
    }

    return sections[currentIndex + 1]?.title ?? 'Siguiente sección';
  }, [canGoForward, currentIndex, currentSection.id, visitaTieneCorteTemprano]);

  const buildLocalDraft = (): RelevamientoLocalDraft => ({
    version: 1,
    savedAt: new Date().toISOString(),
    currentSectionId,
    selectedPredioId,
    selectedPredio,
    resultadoVisita,
    vivienda,
    hogares,
    personasContactosPorHogar,
    cierre,
    finalizacionSimulada,
  });

  const markDraftPending = () => {
    setDraftStatus('CAMBIOS_PENDIENTES');
  };

  const saveCurrentLocalDraft = () => {
    if (!hasStartedDraft) {
      setDraftStatus(hasLocalDraft() ? 'GUARDADO_LOCAL' : 'SIN_BORRADOR');
      return;
    }

    const draft = buildLocalDraft();
    const saved = saveLocalDraft(draft);

    if (saved) {
      setLastSavedAt(draft.savedAt);
      setDraftStatus('GUARDADO_LOCAL');
      return;
    }

    setDraftStatus('ERROR_GUARDAR');
  };

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
    finalizacionSimulada,
    hasStartedDraft,
    hogares,
    pendingLocalDraft,
    personasContactosPorHogar,
    resultadoVisita,
    selectedPredio,
    selectedPredioId,
    vivienda,
  ]);

  const applyLocalDraft = (draft: RelevamientoLocalDraft) => {
    setCurrentSectionId(draft.currentSectionId);
    setSelectedPredioId(draft.selectedPredioId);
    setSelectedPredio(draft.selectedPredio);
    setResultadoVisita(draft.resultadoVisita);
    setVivienda(draft.vivienda);
    setHogares(draft.hogares);
    setPersonasContactosPorHogar(draft.personasContactosPorHogar);
    setCierre(draft.cierre);
    setFinalizacionSimulada(draft.finalizacionSimulada);
    setLastSavedAt(draft.savedAt);
    setPendingLocalDraft(null);
    setDraftStatus('BORRADOR_RECUPERADO');
  };

  const discardLocalDraft = () => {
    clearLocalDraft();
    setPendingLocalDraft(null);
    setLastSavedAt('');
    setDraftStatus('SIN_BORRADOR');
  };

  const resetCierre = () => {
    setCierre(cierreRelevamientoInicial);
    setFinalizacionSimulada(false);
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

  const handlePredioSelected = (predioId: string, predioDetalle: PredioDetalle | null) => {
    setSelectedPredioId(predioId);
    setSelectedPredio(predioDetalle);
    setResultadoVisita(resultadoVisitaInicial);
    resetViviendaHogares();
    setCurrentSectionId('inicio-predio-visita');
    markDraftPending();
  };

  const handleResultadoVisitaChange = (nextResultado: ResultadoVisitaFormState) => {
    setResultadoVisita(nextResultado);
    markDraftPending();

    if (!permiteContinuarFormulario(nextResultado.resultado)) {
      resetViviendaHogares();
      setCurrentSectionId('inicio-predio-visita');
    }
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
    setFinalizacionSimulada(false);
    markDraftPending();
  };

  const updateHogar = (updatedHogar: HogarFormState) => {
    setHogares((currentHogares) =>
      currentHogares.map((hogar) =>
        hogar.id === updatedHogar.id ? updatedHogar : hogar,
      ),
    );
    setFinalizacionSimulada(false);
    markDraftPending();
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

    setFinalizacionSimulada(false);
    markDraftPending();
  };

  const handlePersonasContactosChange = (nextState: PersonasContactosPorHogarState) => {
    setPersonasContactosPorHogar(nextState);
    setFinalizacionSimulada(false);
    markDraftPending();
  };

  const handleCierreChange = (nextCierre: CierreRelevamientoFormState) => {
    setCierre(nextCierre);
    setFinalizacionSimulada(false);
    markDraftPending();
  };

  const handleFinalizarSimulado = () => {
    setFinalizacionSimulada(true);
    markDraftPending();
  };

  const isSectionDisabled = (section: RelevamientoSection) => {
    if (section.order === 1) {
      return false;
    }

    return !seccionInicialCompleta;
  };

  const selectSection = (sectionId: RelevamientoSectionId) => {
    const nextSection = sections.find((section) => section.id === sectionId);

    if (!nextSection || isSectionDisabled(nextSection)) {
      return;
    }

    setCurrentSectionId(sectionId);
    markDraftPending();
  };

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    setCurrentSectionId(sections[currentIndex - 1].id);
    markDraftPending();
  };

  const goForward = () => {
    if (!canGoForward) {
      return;
    }

    setCurrentSectionId(sections[currentIndex + 1].id);
    markDraftPending();
  };

  return (
    <Stack gap={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={8}>
              <p className="text-uppercase text-secondary fw-semibold small mb-2">
                FE-9 · Borrador local MVP
              </p>
              <h1 className="h2 mb-2">Flujo visual del relevamiento</h1>
              <p className="text-secondary mb-0">
                Flujo visual completo con borrador local único. No hay guardado en servidor,
                sincronización ni finalización real.
              </p>
            </Col>

            <Col lg={4}>
              <Alert variant={visitaTieneCorteTemprano ? 'warning' : 'info'} className="mb-0">
                Sección actual: <strong>{currentSection.order}</strong>
              </Alert>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Stack gap={3}>
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
              <div>
                <Badge bg="secondary" className="mb-2">
                  Borrador local
                </Badge>
                <h2 className="h5 mb-1">{localDraftStatusLabel[draftStatus]}</h2>
                <p className="text-secondary mb-0">
                  Key local: <code>{LOCAL_DRAFT_STORAGE_KEY}</code>
                </p>
              </div>

              <div className="d-flex flex-column flex-md-row gap-2">
                <Button
                  variant="outline-primary"
                  onClick={saveCurrentLocalDraft}
                  disabled={!hasStartedDraft}
                >
                  Guardar borrador local
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={discardLocalDraft}
                  disabled={!hasLocalDraft() && !pendingLocalDraft}
                >
                  Limpiar borrador
                </Button>
              </div>
            </div>

            <Alert variant="warning" className="mb-0">
              El borrador usa almacenamiento local del navegador solo como solución MVP para no perder la carga.
              Puede contener datos personales o sensibles. No es guardado en servidor ni
              offline completo. Su uso real depende de tablets autorizadas y controladas.
            </Alert>

            {lastSavedAt ? (
              <Alert variant="success" className="mb-0">
                Último guardado local: <strong>{formatSavedAt(lastSavedAt)}</strong>.
              </Alert>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay hora de guardado local registrada.
              </Alert>
            )}

            {pendingLocalDraft ? (
              <Alert variant="info" className="mb-0">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    Hay un borrador local disponible del{' '}
                    <strong>{formatSavedAt(pendingLocalDraft.savedAt)}</strong>.
                    Podés continuarlo o descartarlo.
                  </div>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => applyLocalDraft(pendingLocalDraft)}
                    >
                      Continuar borrador
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={discardLocalDraft}>
                      Descartar borrador
                    </Button>
                  </div>
                </div>
              </Alert>
            ) : null}
          </Stack>
        </Card.Body>
      </Card>

      <SectionStepper
        sections={sections}
        currentSectionId={currentSection.id}
        onSelectSection={selectSection}
        isSectionDisabled={isSectionDisabled}
      />

      <SectionPlaceholder section={currentSection}>
        {currentSection.id === 'inicio-predio-visita' ? (
          <Stack gap={3}>
            <TerritorialSelector
              selectedPredioId={selectedPredioId}
              onPredioSelected={handlePredioSelected}
            />

            {selectedPredio ? (
              <ResultadoVisitaSelector
                value={resultadoVisita}
                onChange={handleResultadoVisitaChange}
              />
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
            onRemoveHogar={removeHogar}
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
            finalizacionSimulada={finalizacionSimulada}
            onCierreChange={handleCierreChange}
            onFinalizarSimulado={handleFinalizarSimulado}
          />
        ) : null}
      </SectionPlaceholder>

      {visitaTieneCorteTemprano ? (
        <Alert variant="warning" className="mb-0">
          El resultado seleccionado genera corte temprano. El flujo queda detenido antes de
          vivienda, hogares, personas, servicios y salud.
        </Alert>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <Button variant="outline-secondary" onClick={goBack} disabled={!canGoBack}>
              Retroceder
            </Button>

            <div className="text-center text-secondary">
              Próximo paso visual: <strong>{nextSectionTitle}</strong>
            </div>

            <Button variant="primary" onClick={goForward} disabled={!canGoForward}>
              Avanzar
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Stack>
  );
}
