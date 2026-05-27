import { Badge, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import type { SaludFormState, ServiciosFormState } from '../types/serviciosSalud';

type ServiciosSaludSectionProps = {
  hogarLabel?: string;
  servicios: ServiciosFormState;
  salud: SaludFormState;
  onServiciosChange: (servicios: ServiciosFormState) => void;
  onSaludChange: (salud: SaludFormState) => void;
};

export function ServiciosSaludSection({
  servicios,
  salud,
  onServiciosChange,
  onSaludChange,
  hogarLabel = 'hogar seleccionado',
}: ServiciosSaludSectionProps) {
  const hogarContextLabel = hogarLabel === 'hogar seleccionado' ? 'al hogar seleccionado' : `al ${hogarLabel}`;

  const updateServiciosField = <Field extends keyof ServiciosFormState>(
    field: Field,
    value: ServiciosFormState[Field],
  ) => {
    onServiciosChange({
      ...servicios,
      [field]: value,
    });
  };

  const updateSaludField = <Field extends keyof SaludFormState>(
    field: Field,
    value: SaludFormState[Field],
  ) => {
    onSaludChange({
      ...salud,
      [field]: value,
    });
  };

  const convenioLuzAguaHabilitado = servicios.tieneConvenioLuzAgua === 'SI';
  const cableInternetHabilitado = servicios.tieneCableInternet === 'SI';
  const prestadorPrivadoHabilitado =
    salud.servicioAtencionMedica === 'PRIVADO' || salud.servicioAtencionMedica === 'AMBOS';
  const centroASSEHabilitado =
    salud.servicioAtencionMedica === 'ASSE' || salud.servicioAtencionMedica === 'AMBOS';
  const emergenciaMovilHabilitada = salud.tieneEmergenciaMovil === 'SI';

  return (
    <Stack gap={3}>
      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Servicios
              </Badge>
              <h3 className="h5 mb-1">Servicios del hogar</h3>
              <p className="text-secondary mb-0">
                Complete los datos asociados {hogarContextLabel}.
              </p>
            </div>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="tiene-luz-agua">
                  <Form.Label>Tiene luz / agua *</Form.Label>
                  <Form.Select
                    required
                    value={servicios.tieneLuzAgua}
                    onChange={(event) =>
                      updateServiciosField('tieneLuzAgua', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="NO_SABE">No sabe</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="tiene-convenio-luz-agua">
                  <Form.Label>Tiene convenio de luz / agua *</Form.Label>
                  <Form.Select
                    required
                    value={servicios.tieneConvenioLuzAgua}
                    onChange={(event) =>
                      updateServiciosField('tieneConvenioLuzAgua', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="NO_SABE">No sabe</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="titular-convenio-luz-agua">
                  <Form.Label>Titular convenio luz / agua</Form.Label>
                  <Form.Control
                    value={servicios.titularConvenioLuzAgua}
                    onChange={(event) =>
                      updateServiciosField('titularConvenioLuzAgua', event.target.value)
                    }
                    placeholder="Titular si corresponde."
                    disabled={!convenioLuzAguaHabilitado}
                  />
                  <Form.Text className="text-secondary">
                    Se habilita cuando indica que tiene convenio.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="tiene-cable-internet">
                  <Form.Label>Tiene cable / internet *</Form.Label>
                  <Form.Select
                    required
                    value={servicios.tieneCableInternet}
                    onChange={(event) =>
                      updateServiciosField('tieneCableInternet', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="NO_SABE">No sabe</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group controlId="titular-cable-internet">
                  <Form.Label>Titular cable / internet</Form.Label>
                  <Form.Control
                    value={servicios.titularCableInternet}
                    onChange={(event) =>
                      updateServiciosField('titularCableInternet', event.target.value)
                    }
                    placeholder="Titular si corresponde."
                    disabled={!cableInternetHabilitado}
                  />
                  <Form.Text className="text-secondary">
                    Se habilita cuando indica que tiene cable o internet.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="observaciones-servicios">
              <Form.Label>Observaciones de servicios</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={servicios.observacionesServicios}
                onChange={(event) =>
                  updateServiciosField('observacionesServicios', event.target.value)
                }
                placeholder="Observaciones sobre servicios del hogar."
              />
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>

      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Salud
              </Badge>
              <h3 className="h5 mb-1">Salud del hogar</h3>
              <p className="text-secondary mb-0">
                Complete los datos asociados {hogarContextLabel}.
              </p>
            </div>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="servicio-atencion-medica">
                  <Form.Label>Servicio de atención médica *</Form.Label>
                  <Form.Select
                    value={salud.servicioAtencionMedica}
                    onChange={(event) =>
                      updateSaludField('servicioAtencionMedica', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="ASSE">ASSE</option>
                    <option value="PRIVADO">Privado</option>
                    <option value="AMBOS">Ambos</option>
                    <option value="NINGUNO">Ninguno</option>
                    <option value="NO_SABE">No sabe</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="prestador-privado">
                  <Form.Label>Prestador privado</Form.Label>
                  <Form.Control
                    value={salud.prestadorPrivado}
                    onChange={(event) =>
                      updateSaludField('prestadorPrivado', event.target.value)
                    }
                    placeholder="Prestador privado si corresponde."
                    disabled={!prestadorPrivadoHabilitado}
                  />
                  <Form.Text className="text-secondary">
                    Se habilita para atención privada o ambos.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="centro-asse">
                  <Form.Label>Centro ASSE</Form.Label>
                  <Form.Control
                    value={salud.centroASSE}
                    onChange={(event) => updateSaludField('centroASSE', event.target.value)}
                    placeholder="Centro ASSE si corresponde."
                    disabled={!centroASSEHabilitado}
                  />
                  <Form.Text className="text-secondary">
                    Se habilita para ASSE o ambos.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="tiene-emergencia-movil">
                  <Form.Label>Tiene emergencia móvil *</Form.Label>
                  <Form.Select
                    value={salud.tieneEmergenciaMovil}
                    onChange={(event) =>
                      updateSaludField('tieneEmergenciaMovil', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="NO_SABE">No sabe</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group controlId="emergencia-movil">
                  <Form.Label>Emergencia móvil</Form.Label>
                  <Form.Control
                    value={salud.emergenciaMovil}
                    onChange={(event) => updateSaludField('emergenciaMovil', event.target.value)}
                    placeholder="Nombre de emergencia móvil si corresponde."
                    disabled={!emergenciaMovilHabilitada}
                  />
                  <Form.Text className="text-secondary">
                    Se habilita cuando indica que tiene emergencia móvil.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="observaciones-salud">
              <Form.Label>Observaciones de salud</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={salud.observacionesSalud}
                onChange={(event) => updateSaludField('observacionesSalud', event.target.value)}
                placeholder="Observaciones sobre salud del hogar."
              />
              <Form.Text className="text-secondary">
                Utilice este campo para aclarar situaciones particulares de atención médica, por
                ejemplo cuando en el hogar predomina un tipo de cobertura pero alguna persona se
                atiende en otro servicio.
              </Form.Text>
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>
    </Stack>
  );
}
