import { Alert, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import {
  estadoHogarLabels,
  getEstadoHogar,
  hogarEstaEntrevistado,
  type EstadoHogarMvp,
  type HogarFormState,
} from '../types/viviendaHogar';

type HogarFormCardProps = {
  hogar: HogarFormState;
  index: number;
  onChange: (hogar: HogarFormState) => void;
  onRemove: (hogarId: string) => void;
};

const estadoHogarOptions: EstadoHogarMvp[] = [
  'ENTREVISTADO',
  'PENDIENTE',
  'NO_SE_ENCUENTRA',
  'SE_NIEGA',
];

export function HogarFormCard({ hogar, index, onChange, onRemove }: HogarFormCardProps) {
  const estadoHogar = getEstadoHogar(hogar);
  const estaEntrevistado = hogarEstaEntrevistado(hogar);

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
            <div className="text-secondary small">Complete los datos básicos del hogar.</div>
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
            <Col md={6}>
              <Form.Group controlId={`estado-hogar-${hogar.id}`}>
                <Form.Label>Estado del hogar</Form.Label>
                <Form.Select
                  value={estadoHogar}
                  onChange={(event) =>
                    updateField('estadoHogar', event.target.value as EstadoHogarMvp)
                  }
                >
                  {estadoHogarOptions.map((estado) => (
                    <option key={estado} value={estado}>
                      {estadoHogarLabels[estado]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId={`observacion-estado-hogar-${hogar.id}`}>
                <Form.Label>Observación / motivo / referencia</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={hogar.observacionEstadoHogar ?? ''}
                  onChange={(event) =>
                    updateField('observacionEstadoHogar', event.target.value)
                  }
                  placeholder="Ej: volver otro día, no atienden, se niega, referencia horaria."
                />
                <Form.Text className="text-secondary">
                  Recomendado para hogares pendientes o no entrevistados. No bloquea el avance.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {!estaEntrevistado ? (
            <Alert variant="warning" className="mb-0">
              Este hogar queda guardado como no entrevistado. No se exigirán personas, referente,
              salud ni servicios hasta retomarlo.
            </Alert>
          ) : null}

          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={`tiempo-vive-barrio-${hogar.id}`}>
                <Form.Label>Tiempo que vive en el barrio</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1"
                  value={hogar.tiempoViveBarrio}
                  onChange={(event) => updateField('tiempoViveBarrio', event.target.value)}
                  placeholder="Ej: 5"
                />
                <Form.Text className="text-secondary">
                  Indique la cantidad de años.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
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
                  <option value="VIVIA_ASENTAMIENTO">Vivía cuando era asentamiento</option>
                  <option value="COMPRA_INFORMAL">Compra informal</option>
                  <option value="ALQUILER">Alquiler</option>
                  <option value="PRESTAMO_TEMPORAL">Préstamo temporal</option>
                  <option value="ME_LO_DIERON">Me lo dieron</option>
                  <option value="REALOJO_CANDELARIA">Realojo Candelaria</option>
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
                <Form.Label>¿Está conforme con las características del hogar?</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={hogar.conformeCaracteristicas}
                  onChange={(event) =>
                    updateField('conformeCaracteristicas', event.target.value)
                  }
                  placeholder="Ingrese la respuesta y el motivo si corresponde."
                />
                <Form.Text className="text-secondary">
                  Indique sí, no, parcialmente y detalle el motivo si corresponde.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Stack>
      </Card.Body>
    </Card>
  );
}
