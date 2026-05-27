import { Alert, Badge, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import {
  esCorteTemprano,
  permiteContinuarFormulario,
  type ResultadoVisita,
  type ResultadoVisitaFormState,
} from '../types/resultadoVisita';

type ResultadoVisitaSelectorProps = {
  value: ResultadoVisitaFormState;
  onChange: (nextValue: ResultadoVisitaFormState) => void;
};

export function ResultadoVisitaSelector({ value, onChange }: ResultadoVisitaSelectorProps) {
  const updateField = <Field extends keyof ResultadoVisitaFormState>(
    field: Field,
    fieldValue: ResultadoVisitaFormState[Field],
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleResultadoChange = (resultado: ResultadoVisita) => {
    onChange({
      ...value,
      resultado,
      motivoNegativa: resultado === 'SE_NIEGA' ? value.motivoNegativa : '',
      referencia: resultado === 'NO_SE_ENCUENTRA' ? value.referencia : '',
      contacto: resultado === 'NO_SE_ENCUENTRA' ? value.contacto : '',
      horario: resultado === 'NO_SE_ENCUENTRA' ? value.horario : '',
      observacion: resultado === 'NO_SE_ENCUENTRA' ? value.observacion : '',
    });
  };

  return (
    <Card className="border-0 bg-light">
      <Card.Body>
        <Stack gap={3}>
          <div>
            <Badge bg="primary" className="mb-2">
              Resultado de visita *
            </Badge>
            <h3 className="h5 mb-1">Definir continuidad del relevamiento</h3>
            <p className="text-secondary mb-0">
              Indique el resultado de la visita para continuar o cerrar la carga del predio.
            </p>
          </div>

          <Row className="g-3">
            <Col md={4}>
              <Form.Check
                type="radio"
                id="resultado-entrevista-realizada"
                name="resultado-visita"
                label="Se procede a la entrevista"
                checked={value.resultado === 'ENTREVISTA_REALIZADA'}
                onChange={() => handleResultadoChange('ENTREVISTA_REALIZADA')}
              />
            </Col>

            <Col md={4}>
              <Form.Check
                type="radio"
                id="resultado-se-niega"
                name="resultado-visita"
                label="Se niega"
                checked={value.resultado === 'SE_NIEGA'}
                onChange={() => handleResultadoChange('SE_NIEGA')}
              />
            </Col>

            <Col md={4}>
              <Form.Check
                type="radio"
                id="resultado-no-se-encuentra"
                name="resultado-visita"
                label="No se encuentra"
                checked={value.resultado === 'NO_SE_ENCUENTRA'}
                onChange={() => handleResultadoChange('NO_SE_ENCUENTRA')}
              />
            </Col>
          </Row>

          {value.resultado === 'SE_NIEGA' ? (
            <Form.Group controlId="motivo-negativa">
              <Form.Label>Motivo o texto declarado</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={value.motivoNegativa}
                onChange={(event) => updateField('motivoNegativa', event.target.value)}
                placeholder="Registrar motivo si corresponde."
              />
            </Form.Group>
          ) : null}

          {value.resultado === 'NO_SE_ENCUENTRA' ? (
            <Stack gap={3}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="referencia-no-se-encuentra">
                    <Form.Label>Referencia</Form.Label>
                    <Form.Control
                      value={value.referencia}
                      onChange={(event) => updateField('referencia', event.target.value)}
                      placeholder="Vecino, referencia u otra pista."
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="contacto-no-se-encuentra">
                    <Form.Label>Contacto</Form.Label>
                    <Form.Control
                      value={value.contacto}
                      onChange={(event) => updateField('contacto', event.target.value)}
                      placeholder="Teléfono o contacto sugerido."
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="horario-no-se-encuentra">
                    <Form.Label>Horario</Form.Label>
                    <Form.Control
                      value={value.horario}
                      onChange={(event) => updateField('horario', event.target.value)}
                      placeholder="Horario recomendado."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group controlId="observacion-no-se-encuentra">
                <Form.Label>Observación</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={value.observacion}
                  onChange={(event) => updateField('observacion', event.target.value)}
                  placeholder="Registrar observación si corresponde."
                />
              </Form.Group>
            </Stack>
          ) : null}

          {permiteContinuarFormulario(value.resultado) ? (
            <Alert variant="success" className="mb-0">
              Se procede a la entrevista. El flujo puede continuar hacia vivienda y hogares.
            </Alert>
          ) : null}

          {esCorteTemprano(value.resultado) ? (
            <Alert variant="warning" className="mb-0">
              Con este resultado no corresponde continuar con vivienda, hogares, personas, servicios ni salud.
            </Alert>
          ) : null}

          {!value.resultado ? (
            <Alert variant="secondary" className="mb-0">
              Seleccioná el resultado de visita para definir si el formulario continúa.
            </Alert>
          ) : null}
        </Stack>
      </Card.Body>
    </Card>
  );
}
