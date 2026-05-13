import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Stack } from 'react-bootstrap';
import { SectionPlaceholder } from '../components/SectionPlaceholder';
import { TerritorialSelector } from '../components/TerritorialSelector';
import { SectionStepper } from '../components/SectionStepper';
import type { RelevamientoSection, RelevamientoSectionId } from '../types/relevamientoFlow';

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
      'Lugar reservado para resultado de visita.',
      'Corte temprano pendiente de implementación.',
    ],
  },
  {
    id: 'vivienda-hogares',
    order: 2,
    title: 'Vivienda y hogares',
    description:
      'Sección reservada para datos generales de vivienda y declaración de hogares dentro del predio.',
    includes: [
      'Lugar reservado para datos de vivienda.',
      'Lugar reservado para cantidad de hogares.',
      'Lugar reservado para vínculo entre hogares.',
    ],
  },
  {
    id: 'datos-por-hogar',
    order: 3,
    title: 'Personas, contactos, servicios y salud por hogar',
    description:
      'Sección reservada para cargar información específica dentro de cada hogar declarado.',
    includes: [
      'Personas por hogar.',
      'Contactos por hogar.',
      'Servicios por hogar.',
      'Salud por hogar.',
      'Observaciones por hogar.',
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

  const currentIndex = sections.findIndex((section) => section.id === currentSectionId);
  const currentSection = sections[currentIndex] ?? sections[0];

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < sections.length - 1;

  const nextSectionTitle = useMemo(() => {
    if (!canGoForward) {
      return 'Fin del flujo placeholder';
    }

    return sections[currentIndex + 1]?.title ?? 'Siguiente sección';
  }, [canGoForward, currentIndex]);

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
                FE-2 · Layout tablet y navegación inicial
              </p>
              <h1 className="h2 mb-2">Flujo inicial del relevamiento</h1>
              <p className="text-secondary mb-0">
                Navegación placeholder entre las 4 secciones acordadas. No carga
                datos reales ni consume backend.
              </p>
            </Col>

            <Col lg={4}>
              <Alert variant="info" className="mb-0">
                Sección actual: <strong>{currentSection.order}</strong>
              </Alert>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <SectionStepper
        sections={sections}
        currentSectionId={currentSection.id}
        onSelectSection={setCurrentSectionId}
      />

      <SectionPlaceholder section={currentSection}>
        {currentSection.id === 'inicio-predio-visita' ? <TerritorialSelector /> : null}
      </SectionPlaceholder>

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
