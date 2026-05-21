import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { ResumenRelevamiento } from './ResumenRelevamiento';
import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

type CierreRelevamientoModo = 'completo' | 'corte-temprano';

type CierreRelevamientoSectionProps = {
  cierre: CierreRelevamientoFormState;
  selectedPredio: PredioDetalle | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  finalizacionCompletada: boolean;
  modo?: CierreRelevamientoModo;
  onCierreChange: (cierre: CierreRelevamientoFormState) => void;
  onFinalizarRelevamiento: () => void;
};

export function CierreRelevamientoSection({
  cierre,
  selectedPredio,
  resultadoVisita,
  vivienda,
  hogares,
  personasContactosPorHogar,
  finalizacionCompletada,
  modo = 'completo',
  onCierreChange,
  onFinalizarRelevamiento,
}: CierreRelevamientoSectionProps) {
  const esCorteTemprano = modo === 'corte-temprano';

  const updateField = <Field extends keyof CierreRelevamientoFormState>(
    field: Field,
    value: CierreRelevamientoFormState[Field],
  ) => {
    onCierreChange({
      ...cierre,
      [field]: value,
    });
  };

  return (
    <Stack gap={3}>
      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Observaciones generales
              </Badge>
              <h3 className="h5 mb-1">Cierre del relevamiento</h3>
              <p className="text-secondary mb-0">
                {esCorteTemprano
                  ? 'Complete las observaciones disponibles para cerrar la visita.'
                  : 'Complete las observaciones generales antes de revisar la información.'}
              </p>
            </div>

            <Form.Group controlId="observaciones-generales">
              <Form.Label>Observaciones generales</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={cierre.observacionesGenerales}
                onChange={(event) => updateField('observacionesGenerales', event.target.value)}
                placeholder="Ingrese observaciones generales del relevamiento."
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
                Ubicación a confirmar
              </Badge>
              <h3 className="h5 mb-1">Ubicación del relevamiento</h3>
              <p className="text-secondary mb-0">
                Ingrese la ubicación disponible o déjela pendiente para confirmarla más adelante.
              </p>
            </div>

            <Alert variant="warning" className="mb-0">
              Ingrese o confirme manualmente la ubicación disponible. Esta información podrá verificarse más adelante.
            </Alert>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="latitud-a confirmar">
                  <Form.Label>Latitud</Form.Label>
                  <Form.Control
                    value={cierre.latitud}
                    onChange={(event) => updateField('latitud', event.target.value)}
                    placeholder="Ej: -34.9011"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="longitud-a confirmar">
                  <Form.Label>Longitud</Form.Label>
                  <Form.Control
                    value={cierre.longitud}
                    onChange={(event) => updateField('longitud', event.target.value)}
                    placeholder="Ej: -56.1645"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="hora-captura-a confirmar">
                  <Form.Label>Hora de captura</Form.Label>
                  <Form.Control
                    type="time"
                    value={cierre.horaCaptura}
                    onChange={(event) => updateField('horaCaptura', event.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Stack>
        </Card.Body>
      </Card>

      {!esCorteTemprano ? (
        <Card className="border-0 bg-light">
          <Card.Body>
            <Stack gap={3}>
              <div>
                <Badge bg="primary" className="mb-2">
                  Revisión final
                </Badge>
                <h3 className="h5 mb-1">Resumen previo a finalización</h3>
                <p className="text-secondary mb-0">
                  Resumen de la información cargada para revisión.
                </p>
              </div>

              <ResumenRelevamiento
                selectedPredio={selectedPredio}
                resultadoVisita={resultadoVisita}
                vivienda={vivienda}
                hogares={hogares}
                personasContactosPorHogar={personasContactosPorHogar}
                cierre={cierre}
              />
            </Stack>
          </Card.Body>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <h3 className="h5 mb-1">Revisión y cierre</h3>
              <p className="text-secondary mb-0">
                {esCorteTemprano
                  ? 'Finalice el relevamiento cuando haya registrado la ubicación disponible.'
                  : 'Revise la información antes de marcar la carga como revisada.'}
              </p>
            </div>

            <Alert variant="secondary" className="mb-0">
              {esCorteTemprano
                ? 'Este cierre no habilita vivienda, hogares, personas, servicios ni salud.'
                : 'Revise la información antes de finalizar el relevamiento.'}
            </Alert>

            <Button variant="success" onClick={onFinalizarRelevamiento}>
              Finalizar relevamiento
            </Button>

            {finalizacionCompletada ? (
              <Alert variant="success" className="mb-0">
                Información guardada correctamente.
              </Alert>
            ) : null}
          </Stack>
        </Card.Body>
      </Card>
    </Stack>
  );
}
