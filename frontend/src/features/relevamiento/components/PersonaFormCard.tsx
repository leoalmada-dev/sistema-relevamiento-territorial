import { Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import type { PersonaFormState } from '../types/personaContacto';

type PersonaFormCardProps = {
  persona: PersonaFormState;
  index: number;
  onChange: (persona: PersonaFormState) => void;
  onRemove: (personaId: string) => void;
};

export function PersonaFormCard({
  persona,
  index,
  onChange,
  onRemove,
}: PersonaFormCardProps) {
  const updateField = <Field extends keyof PersonaFormState>(
    field: Field,
    value: PersonaFormState[Field],
  ) => {
    onChange({
      ...persona,
      [field]: value,
    });
  };

  const updatePresentaDiscapacidad = (value: string) => {
    onChange({
      ...persona,
      presentaDiscapacidad: value,
      tipoDiscapacidad: value === 'SI' ? (persona.tipoDiscapacidad ?? '') : '',
    });
  };

  return (
    <Card>
      <Card.Header className="bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <strong>Persona {index + 1}</strong>
            <div className="text-secondary small">
              Complete los datos de la persona integrante del hogar.
            </div>
          </div>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onRemove(persona.id)}
          >
            Eliminar persona
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <Stack gap={3}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={`nombre-persona-${persona.id}`}>
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  value={persona.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  placeholder="Nombre"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId={`apellido-persona-${persona.id}`}>
                <Form.Label>Apellido *</Form.Label>
                <Form.Control
                  value={persona.apellido}
                  onChange={(event) => updateField('apellido', event.target.value)}
                  placeholder="Apellido"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={3}>
              <Form.Group controlId={`cedula-persona-${persona.id}`}>
                <Form.Label>Cédula *</Form.Label>
                <Form.Control
                  value={persona.cedula}
                  onChange={(event) => updateField('cedula', event.target.value)}
                  placeholder="Cédula"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId={`edad-persona-${persona.id}`}>
                <Form.Label>Edad *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={persona.edad}
                  onChange={(event) => updateField('edad', event.target.value)}
                  placeholder="Edad"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId={`sexo-persona-${persona.id}`}>
                <Form.Label>Género *</Form.Label>
                <Form.Select
                  value={persona.sexo}
                  onChange={(event) => updateField('sexo', event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="MUJER">Mujer</option>
                  <option value="MUJER_TRANS">Mujer trans</option>
                  <option value="VARON">Varón</option>
                  <option value="VARON_TRANS">Varón trans</option>
                  <option value="OTRA">Otra</option>
                  <option value="NO_SABE_NO_RESPONDE">No sabe / No responde</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId={`ocupacion-persona-${persona.id}`}>
                <Form.Label>Ocupación *</Form.Label>
                <Form.Select
                  value={persona.ocupacion}
                  onChange={(event) => updateField('ocupacion', event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="EMPLEADO">Empleado</option>
                  <option value="TRABAJADOR_INDEPENDIENTE">Trabajador independiente</option>
                  <option value="DESOCUPADO">Desocupado</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="OTRO">Otro</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId={`ascendencia-etnico-racial-persona-${persona.id}`}>
                <Form.Label>Ascendencia étnico-racial</Form.Label>
                <Form.Select
                  value={persona.ascendenciaEtnicoRacial ?? ''}
                  onChange={(event) =>
                    updateField('ascendenciaEtnicoRacial', event.target.value)
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="AFRO_NEGRA">Afro o negra</option>
                  <option value="ASIATICA">Asiática</option>
                  <option value="BLANCA">Blanca</option>
                  <option value="INDIGENA">Indígena</option>
                  <option value="OTRA">Otra</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId={`presenta-discapacidad-persona-${persona.id}`}>
                <Form.Label>¿Presenta alguna discapacidad?</Form.Label>
                <Form.Select
                  value={persona.presentaDiscapacidad ?? ''}
                  onChange={(event) => updatePresentaDiscapacidad(event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId={`tipo-discapacidad-persona-${persona.id}`}>
                <Form.Label>Tipo de discapacidad</Form.Label>
                <Form.Select
                  value={persona.tipoDiscapacidad ?? ''}
                  onChange={(event) => updateField('tipoDiscapacidad', event.target.value)}
                  disabled={persona.presentaDiscapacidad !== 'SI'}
                >
                  <option value="">Seleccionar</option>
                  <option value="VISION">Visión</option>
                  <option value="AUDICION">Audición</option>
                  <option value="MOVILIDAD">Movilidad</option>
                  <option value="COGNICION">Cognición</option>
                  <option value="AUTOCUIDADO">Autocuidado</option>
                  <option value="COMUNICACION">Comunicación</option>
                </Form.Select>
                {persona.presentaDiscapacidad === 'SI' ? null : (
                  <Form.Text className="text-secondary">
                    Se habilita si la persona presenta alguna discapacidad.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId={`referente-persona-${persona.id}`}>
                <Form.Label>Referente del hogar</Form.Label>
                <Form.Check
                  type="switch"
                  checked={persona.esReferente}
                  label={persona.esReferente ? 'Sí' : 'No'}
                  onChange={(event) => updateField('esReferente', event.target.checked)}
                />
              </Form.Group>
            </Col>

            <Col md={8}>
              <Form.Group controlId={`parentesco-persona-${persona.id}`}>
                <Form.Label>Parentesco con referente *</Form.Label>
                <Form.Select
                  value={persona.parentescoConReferente}
                  onChange={(event) =>
                    updateField('parentescoConReferente', event.target.value)
                  }
                  disabled={persona.esReferente}
                >
                  <option value="">Seleccionar</option>
                  <option value="CONYUGE">Cónyuge</option>
                  <option value="HIJO_A">Hijo/a</option>
                  <option value="FAMILIAR">Familiar</option>
                  <option value="OTRO">Otro</option>
                </Form.Select>
                {persona.esReferente ? (
                  <Form.Text>
                    Si esta persona es referente, el parentesco puede quedar vacío.
                  </Form.Text>
                ) : (
                  <Form.Text>
                    Obligatorio si la persona no es referente.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId={`vinculo-barrio-familia-persona-${persona.id}`}>
            <Form.Label>
              ¿Cómo es su vínculo con el barrio? ¿Tiene más familia en la zona?
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={persona.vinculoBarrioFamilia ?? ''}
              onChange={(event) => updateField('vinculoBarrioFamilia', event.target.value)}
              placeholder="Ingrese la respuesta si corresponde."
            />
            <Form.Text className="text-secondary">
              Por barrio se entiende la zona donde se está realizando el relevamiento.
            </Form.Text>
          </Form.Group>

          <Form.Group controlId={`observaciones-persona-${persona.id}`}>
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={persona.observaciones}
              onChange={(event) => updateField('observaciones', event.target.value)}
              placeholder="Observaciones de la persona si corresponde."
            />
          </Form.Group>
        </Stack>
      </Card.Body>
    </Card>
  );
}
