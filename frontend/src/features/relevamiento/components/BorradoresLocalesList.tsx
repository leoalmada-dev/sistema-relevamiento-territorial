import { Badge, Button, Col, ListGroup, Row, Stack } from 'react-bootstrap';
import { getLocalDraftPredioDisplayLabel } from '../services/draftStorageService';
import type { RelevamientoLocalDraftIndexItem } from '../types/relevamientoDraft';

type BorradoresLocalesListProps = {
  drafts: RelevamientoLocalDraftIndexItem[];
  activeDraftKey: string | null;
  onRetomar: (draftKey: string) => void;
  onDescartar: (draftKey: string) => void;
};

const sectionLabels: Record<string, string> = {
  'inicio-predio-visita': 'Inicio, predio y resultado de visita',
  'vivienda-hogares': 'Vivienda y hogares',
  'datos-por-hogar': 'Personas, contactos, servicios y salud',
  'cierre-finalizacion': 'Observaciones, coordenadas y finalización',
};

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

function formatSectionLabel(sectionId: string) {
  return sectionLabels[sectionId] ?? sectionId;
}

export function BorradoresLocalesList({
  drafts,
  activeDraftKey,
  onRetomar,
  onDescartar,
}: BorradoresLocalesListProps) {
  if (drafts.length === 0) {
    return (
      <p className="text-secondary mb-0">
        No hay cargas locales sin finalizar guardadas en esta tablet.
      </p>
    );
  }

  return (
    <ListGroup variant="flush">
      {drafts.map((draft) => {
        const isActive = activeDraftKey === draft.draftKey;
        const predioLabel = getLocalDraftPredioDisplayLabel(draft);

        return (
          <ListGroup.Item key={draft.draftKey} className="px-0">
            <Row className="align-items-center g-3">
              <Col lg={7}>
                <Stack gap={1}>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <strong>{predioLabel}</strong>
                    {isActive ? <Badge bg="primary">Carga activa</Badge> : null}
                  </div>

                  <span className="text-secondary small">
                    Sección: {formatSectionLabel(draft.currentSectionId)}
                  </span>

                  <span className="text-secondary small">
                    Hogares cargados: {draft.cantidadHogares} · Guardado:{' '}
                    {formatSavedAt(draft.savedAt)}
                  </span>

                  {draft.serverDraftId ? (
                    <span className="text-secondary small">
                      Borrador servidor: #{draft.serverDraftId}
                      {draft.serverDraftVersion ? ` · versión ${draft.serverDraftVersion}` : ''}
                    </span>
                  ) : null}
                </Stack>
              </Col>

              <Col lg={5}>
                <div className="d-flex flex-column flex-md-row justify-content-lg-end gap-2">
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onRetomar(draft.draftKey)}
                  >
                    Retomar
                  </Button>

                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDescartar(draft.draftKey)}
                  >
                    Descartar
                  </Button>
                </div>
              </Col>
            </Row>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}
