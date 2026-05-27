import { Badge, Button, Col, ListGroup, Row, Spinner, Stack } from 'react-bootstrap';
import type { BackendBorradorServidorItem } from '../types/relevamientoBackend';

type BorradoresServidorListProps = {
  drafts: BackendBorradorServidorItem[];
  isLoading: boolean;
  onRetomar: (draftId: number) => void;
};

const sectionLabels: Record<string, string> = {
  inicio_predio_visita: 'Inicio, predio y resultado de visita',
  vivienda_hogares: 'Vivienda y hogares',
  datos_por_hogar: 'Personas, contactos, servicios y salud',
  cierre_finalizacion: 'Observaciones, coordenadas y finalización',
};

function formatSavedAt(savedAt: string | null | undefined) {
  if (!savedAt) {
    return 'Sin fecha';
  }

  try {
    return new Intl.DateTimeFormat('es-UY', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(savedAt));
  } catch {
    return savedAt;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function getPredioLabel(draft: BackendBorradorServidorItem) {
  const datos = asRecord(draft.datos);
  const territorio = asRecord(datos.territorio);
  const predio = asRecord(territorio.predio);
  const calle = asString(predio.calle);
  const numero = asString(predio.numero_teorico_puerta || predio.nro_puerta);
  const predioId = asString(draft.predio_id || territorio.predio_id || predio.id);

  if (calle || numero) {
    return [calle, numero].filter(Boolean).join(' ');
  }

  return predioId ? `Predio ${predioId}` : 'Predio sin identificar';
}

function getSectionLabel(sectionId: string | null | undefined) {
  if (!sectionId) {
    return 'Sin sección';
  }

  return sectionLabels[sectionId] ?? sectionId;
}

export function BorradoresServidorList({
  drafts,
  isLoading,
  onRetomar,
}: BorradoresServidorListProps) {
  if (isLoading) {
    return (
      <div className="d-flex align-items-center gap-2 text-secondary">
        <Spinner animation="border" size="sm" />
        <span>Cargando borradores servidor...</span>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <p className="text-secondary mb-0">
        No hay borradores servidor pendientes para esta tablet.
      </p>
    );
  }

  return (
    <ListGroup variant="flush">
      {drafts.map((draft) => (
        <ListGroup.Item key={draft.id} className="px-0">
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <Stack gap={1}>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <strong>{getPredioLabel(draft)}</strong>
                  <Badge bg={draft.completed ? 'secondary' : 'success'}>
                    {draft.completed ? 'Finalizado' : 'Pendiente'}
                  </Badge>
                </div>

                <span className="text-secondary small">
                  Sección: {getSectionLabel(draft.current_section)}
                </span>

                <span className="text-secondary small">
                  Borrador servidor: #{draft.id}
                  {draft.draft_version ? ` · versión ${draft.draft_version}` : ''}
                </span>

                <span className="text-secondary small">
                  Última actualización: {formatSavedAt(draft.updated_at || draft.created_at)}
                </span>
              </Stack>
            </Col>

            <Col lg={5}>
              <div className="d-flex justify-content-lg-end">
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onRetomar(draft.id)}
                  disabled={draft.completed}
                >
                  Retomar
                </Button>
              </div>
            </Col>
          </Row>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
