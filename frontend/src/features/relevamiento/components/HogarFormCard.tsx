import { Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import type { HogarFormState } from '../types/viviendaHogar';

type HogarFormCardProps = {
  hogar: HogarFormState;
  index: number;
  onChange: (hogar: HogarFormState) => void;
  onRemove: (hogarId: string) => void;
};

export function HogarFormCard({ hogar, index, onChange, onRemove }: HogarFormCardProps) {
  const updateField = <Field extends keyof HogarFormState>(
    field: Field,
    value: HogarFormState[Field],
  ) => {
    onChange({
      ...hogar,
      [field]: value,
    });
  };

  return (
    <Card>
      <Card.Header className="bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <strong>Hogar {index + 1}</strong>
            <div className="text-secondary small">
              Complete los datos básicos del hogar.
            </div>
          </div>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onRemove(hogar.id)}
          >
            Eliminar hogar
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <Stack gap={3}>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId={`numero-hogar-${hogar.id}`}>
                <Form.Label>Número de hogar</Form.Label>
                <Form.Control
                  value={hogar.numeroHogar}
                  onChange={(event) => updateField('numeroHogar', event.target.value)}
                  placeholder="Ej: 1"
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId={`tiempo-vive-barrio-${hogar.id}`}>
                <Form.Label>Tiempo que vive en el barrio</Form.Label>
                <Form.Control
                  value={hogar.tiempoViveBarrio}
                  onChange={(event) => updateField('tiempoViveBarrio', event.target.value)}
                  placeholder="Ej: 5 años"
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId={`beneficiario-regularizacion-${hogar.id}`}>
                <Form.Label>Beneficiario de regularización PIAI</Form.Label>
                <Form.Select
                  value={hogar.beneficiarioRegularizacion}
                  onChange={(event) =>
                    updateField('beneficiarioRegularizacion', event.target.value)
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                  <option value="NO_SABE">No sabe</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={`forma-acceso-vivienda-${hogar.id}`}>
                <Form.Label>¿Cómo accedieron a esta vivienda?</Form.Label>
                <Form.Select
                  value={hogar.formaAccesoVivienda}
                  onChange={(event) => updateField('formaAccesoVivienda', event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="COMPRA">Compra</option>
                  <option value="ALQUILER">Alquiler</option>
                  <option value="CESION">Cesión</option>
                  <option value="OCUPACION">Ocupación</option>
                  <option value="OTRO">Otro</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId={`forma-acceso-otro-${hogar.id}`}>
                <Form.Label>Otra forma de acceso</Form.Label>
                <Form.Control
                  value={hogar.formaAccesoOtro}
                  onChange={(event) => updateField('formaAccesoOtro', event.target.value)}
                  placeholder="Completar solo si corresponde."
                  disabled={hogar.formaAccesoVivienda !== 'OTRO'}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={`titular-vivienda-${hogar.id}`}>
                <Form.Label>Titular de la vivienda</Form.Label>
                <Form.Control
                  value={hogar.titularVivienda}
                  onChange={(event) => updateField('titularVivienda', event.target.value)}
                  placeholder="Nombre o referencia del titular si corresponde."
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId={`conforme-caracteristicas-${hogar.id}`}>
                <Form.Label>Conforme con características</Form.Label>
                <Form.Select
                  value={hogar.conformeCaracteristicas}
                  onChange={(event) =>
                    updateField('conformeCaracteristicas', event.target.value)
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                  <option value="PARCIAL">Parcialmente</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Stack>
      </Card.Body>
    </Card>
  );
}
