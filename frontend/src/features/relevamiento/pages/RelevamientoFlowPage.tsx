import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Stack } from 'react-bootstrap';
import { PersonasContactosSection } from '../components/PersonasContactosSection';
import { ResultadoVisitaSelector } from '../components/ResultadoVisitaSelector';
import { SectionPlaceholder } from '../components/SectionPlaceholder';
import { SectionStepper } from '../components/SectionStepper';
import { TerritorialSelector } from '../components/TerritorialSelector';
import { ViviendaHogaresSection } from '../components/ViviendaHogaresSection';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
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
      'Sección temporal para personas y contactos por hogar. Servicios y salud quedan para una fase posterior.',
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
      'Cierre del relevamiento con observaciones generales, coordenadas y confirmación final.',
    includes: [
      'Observaciones generales del relevamiento.',
      'Coordenadas asociadas al relevamiento completo.',
      'Revisión final pendiente.',
      'Finalización pendiente.',
    ],
  },
];

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

  const currentIndex = sections.findIndex((section) => section.id === currentSectionId);
  const currentSection = sections[currentIndex] ?? sections[0];

  const visitaPermiteContinuar = permiteContinuarFormulario(resultadoVisita.resultado);
  const visitaTieneCorteTemprano = esCorteTemprano(resultadoVisita.resultado);
  const seccionInicialCompleta = Boolean(selectedPredio) && visitaPermiteContinuar;

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

  const resetPersonasContactos = () => {
    setPersonasContactosPorHogar({});
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
  };

  const handleResultadoVisitaChange = (nextResultado: ResultadoVisitaFormState) => {
    setResultadoVisita(nextResultado);

    if (!permiteContinuarFormulario(nextResultado.resultado)) {
      resetViviendaHogares();
      setCurrentSectionId('inicio-predio-visita');
    }
  };

  const addHogar = () => {
    setHogares((currentHogares) => [
      ...currentHogares,
      crearHogarInicial(currentHogares.length + 1),
    ]);
  };

  const updateHogar = (updatedHogar: HogarFormState) => {
    setHogares((currentHogares) =>
      currentHogares.map((hogar) =>
        hogar.id === updatedHogar.id ? updatedHogar : hogar,
      ),
    );
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
  };

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    setCurrentSectionId(sections[currentIndex - 1].id);
  };

  const goForward = () => {
    if (!canGoForward) {
      return;
    }

    setCurrentSectionId(sections[currentIndex + 1].id);
  };

  return (
    <Stack gap={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={8}>
              <p className="text-uppercase text-secondary fw-semibold small mb-2">
                FE-7 · Servicios y salud por hogar
              </p>
              <h1 className="h2 mb-2">Flujo inicial del relevamiento</h1>
              <p className="text-secondary mb-0">
                Sección 3 con personas, contactos, servicios y salud asociados a cada hogar.
                No hay guardado local ni backend conectado.
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
            onViviendaChange={setVivienda}
            onAddHogar={addHogar}
            onUpdateHogar={updateHogar}
            onRemoveHogar={removeHogar}
          />
        ) : null}

        {currentSection.id === 'datos-por-hogar' ? (
          <PersonasContactosSection
            hogares={hogares}
            personasContactosPorHogar={personasContactosPorHogar}
            onChange={setPersonasContactosPorHogar}
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
