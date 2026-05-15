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
    if (!window.confirm('¿Descartar la información guardada en este dispositivo? Esta acción no se puede deshacer.')) {
      return;
    }

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
                Guardado automáticamente
              </p>
              <h1 className="h2 mb-2">Formulario de relevamiento territorial</h1>
              <p className="text-secondary mb-0">
                Complete el relevamiento por secciones. La información se guarda automáticamente
                en este dispositivo durante la carga.
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
                  Guardado automáticamente
                </Badge>
                <h2 className="h5 mb-1">{localDraftStatusLabel[draftStatus]}</h2>
                <p className="text-secondary mb-0">
                  La información se guarda en este dispositivo durante la carga.
                </p>
              </div>

              <div className="d-flex flex-column flex-md-row gap-2">
                <Button
                  variant="outline-primary"
                  onClick={saveCurrentLocalDraft}
                  disabled={!hasStartedDraft}
                >
                  Guardar ahora
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={discardLocalDraft}
                  disabled={!hasLocalDraft() && !pendingLocalDraft}
                >
                  Descartar información guardada
                </Button>
              </div>
            </div>

            <Alert variant="warning" className="mb-0">
              La información se guarda automáticamente en este dispositivo durante la carga.
              Puede contener datos personales o sensibles. Usar únicamente en tablets autorizadas.
            </Alert>

            {lastSavedAt ? (
              <Alert variant="success" className="mb-0">
                Último guardado: <strong>{formatSavedAt(lastSavedAt)}</strong>.
              </Alert>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Todavía no hay hora de guardado registrada.
              </Alert>
            )}

            {pendingLocalDraft ? (
              <Alert variant="info" className="mb-0">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    Hay información guardada disponible del{' '}
                    <strong>{formatSavedAt(pendingLocalDraft.savedAt)}</strong>.
                    Podés continuar la carga o descartar la información guardada.
                  </div>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => applyLocalDraft(pendingLocalDraft)}
                    >
                      Continuar carga
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={discardLocalDraft}>
                      Descartar información guardada
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
