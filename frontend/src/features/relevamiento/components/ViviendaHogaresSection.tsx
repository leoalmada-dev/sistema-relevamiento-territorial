import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { HogarFormCard } from './HogarFormCard';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

type ViviendaHogaresSectionProps = {
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  onViviendaChange: (vivienda: ViviendaFormState) => void;
  onAddHogar: () => void;
  onUpdateHogar: (hogar: HogarFormState) => void;
  onRemoveHogar: (hogarId: string) => void;
};

export function ViviendaHogaresSection({
  vivienda,
  hogares,
  onViviendaChange,
  onAddHogar,
  onUpdateHogar,
  onRemoveHogar,
}: ViviendaHogaresSectionProps) {
  const updateViviendaField = <Field extends keyof ViviendaFormState>(
    field: Field,
    value: ViviendaFormState[Field],
  ) => {
    onViviendaChange({
      ...vivienda,
      [field]: value,
    });
  };

  const cantidadDeclarada = Number(vivienda.cantidadHogaresDeclarada);
  const tieneCantidadDeclarada = Number.isFinite(cantidadDeclarada) && cantidadDeclarada > 0;
  const cantidadCoincide =
    tieneCantidadDeclarada && cantidadDeclarada === hogares.length;

  return (
    <Stack gap={3}>
      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Vivienda
              </Badge>
              <h3 className="h5 mb-1">Datos generales de vivienda</h3>
              <p className="text-secondary mb-0">
                Datos temporales en memoria React. No hay guardado local ni backend conectado.
              </p>
            </div>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="cantidad-hogares-declarada">
                  <Form.Label>Cantidad de hogares declarada</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={vivienda.cantidadHogaresDeclarada}
                    onChange={(event) =>
                      updateViviendaField('cantidadHogaresDeclarada', event.target.value)
                    }
                    placeholder="Ej: 2"
                  />
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group controlId="vinculo-entre-hogares">
                  <Form.Label>Vínculo entre hogares</Form.Label>
                  <Form.Control
                    value={vivienda.vinculoEntreHogares}
                    onChange={(event) =>
                      updateViviendaField('vinculoEntreHogares', event.target.value)
                    }
                    placeholder="Ej: familiares, vecinos, unidades independientes."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="observaciones-vivienda">
              <Form.Label>Observaciones de vivienda</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={vivienda.observacionesVivienda}
                onChange={(event) =>
                  updateViviendaField('observacionesVivienda', event.target.value)
                }
                placeholder="Registrar observaciones generales de vivienda si corresponde."
              />
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>

      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
              <div>
                <Badge bg="primary" className="mb-2">
                  Hogares
                </Badge>
                <h3 className="h5 mb-1">Hogares dentro del predio</h3>
                <p className="text-secondary mb-0">
                  Permite agregar, editar, listar y eliminar hogares en estado temporal.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={onAddHogar}>
                  Agregar hogar
                </Button>
              </div>
            </div>

            {tieneCantidadDeclarada ? (
              <Alert
                variant={cantidadCoincide ? 'success' : 'warning'}
                className="mb-0"
              >
                Hogares declarados: <strong>{cantidadDeclarada}</strong>. Hogares cargados:{' '}
                <strong>{hogares.length}</strong>.
              </Alert>
            ) : (
              <Alert variant="secondary" className="mb-0">
                Indicá la cantidad declarada y agregá los hogares correspondientes.
              </Alert>
            )}

            {hogares.length > 0 ? (
              <Stack gap={3}>
                {hogares.map((hogar, index) => (
                  <HogarFormCard
                    key={hogar.id}
                    hogar={hogar}
                    index={index}
                    onChange={onUpdateHogar}
                    onRemove={onRemoveHogar}
                  />
                ))}
              </Stack>
            ) : (
              <Alert variant="info" className="mb-0">
                Todavía no hay hogares cargados para este predio.
              </Alert>
            )}
          </Stack>
        </Card.Body>
      </Card>
    </Stack>
  );
}
