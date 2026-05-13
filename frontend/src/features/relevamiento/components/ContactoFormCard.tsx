import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import type { ContactoFormState } from '../types/personaContacto';

type ContactoFormCardProps = {
  contacto: ContactoFormState;
  index: number;
  onChange: (contacto: ContactoFormState) => void;
  onRemove: (contactoId: string) => void;
};

export function ContactoFormCard({
  contacto,
  index,
  onChange,
  onRemove,
}: ContactoFormCardProps) {
  const updateField = <Field extends keyof ContactoFormState>(
    field: Field,
    value: ContactoFormState[Field],
  ) => {
    onChange({
      ...contacto,
      [field]: value,
    });
  };

  return (
    <Card>
      <Card.Header className="bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <strong>Contacto {index + 1}</strong>
            <div className="text-secondary small">
              Objetivo operativo inicial: hasta dos contactos por hogar.
            </div>
          </div>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onRemove(contacto.id)}
          >
            Eliminar contacto
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className="g-3">
          <Col md={2}>
            <Form.Group controlId={`orden-contacto-${contacto.id}`}>
              <Form.Label>Orden</Form.Label>
              <Form.Control
                value={contacto.orden}
                onChange={(event) => updateField('orden', event.target.value)}
                placeholder="1"
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group controlId={`telefono-contacto-${contacto.id}`}>
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                value={contacto.telefono}
                onChange={(event) => updateField('telefono', event.target.value)}
                placeholder="Teléfono"
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId={`nombre-referencia-contacto-${contacto.id}`}>
              <Form.Label>Nombre de referencia</Form.Label>
              <Form.Control
                value={contacto.nombreReferencia}
                onChange={(event) => updateField('nombreReferencia', event.target.value)}
                placeholder="Persona de referencia"
              />
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group controlId={`observaciones-contacto-${contacto.id}`}>
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={contacto.observaciones}
                onChange={(event) => updateField('observaciones', event.target.value)}
                placeholder="Observaciones del contacto si corresponde."
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
