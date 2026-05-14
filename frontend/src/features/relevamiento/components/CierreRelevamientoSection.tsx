import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { ResumenRelevamiento } from './ResumenRelevamiento';
import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

type CierreRelevamientoSectionProps = {
  cierre: CierreRelevamientoFormState;
  selectedPredio: PredioDetalle | null;
  resultadoVisita: ResultadoVisitaFormState;
  vivienda: ViviendaFormState;
  hogares: HogarFormState[];
  personasContactosPorHogar: PersonasContactosPorHogarState;
  finalizacionSimulada: boolean;
  onCierreChange: (cierre: CierreRelevamientoFormState) => void;
  onFinalizarSimulado: () => void;
};

export function CierreRelevamientoSection({
  cierre,
  selectedPredio,
  resultadoVisita,
  vivienda,
  hogares,
  personasContactosPorHogar,
  finalizacionSimulada,
  onCierreChange,
  onFinalizarSimulado,
}: CierreRelevamientoSectionProps) {
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
                Datos temporales en memoria React. No hay guardado real ni backend conectado.
              </p>
            </div>

            <Form.Group controlId="observaciones-generales">
              <Form.Label>Observaciones generales</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={cierre.observacionesGenerales}
                onChange={(event) => updateField('observacionesGenerales', event.target.value)}
                placeholder="Observaciones generales del relevamiento."
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
                Coordenadas placeholder
              </Badge>
              <h3 className="h5 mb-1">Ubicación del relevamiento</h3>
              <p className="text-secondary mb-0">
                Placeholder temporal para preparar la futura captura o confirmación de ubicación.
              </p>
            </div>

            <Alert variant="warning" className="mb-0">
              Todavía no hay mapa real, pin real ni geolocalización real. Estos campos no se
              capturan automáticamente.
            </Alert>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="latitud-placeholder">
                  <Form.Label>Latitud</Form.Label>
                  <Form.Control
                    value={cierre.latitud}
                    onChange={(event) => updateField('latitud', event.target.value)}
                    placeholder="Ej: -34.9011"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="longitud-placeholder">
                  <Form.Label>Longitud</Form.Label>
                  <Form.Control
                    value={cierre.longitud}
                    onChange={(event) => updateField('longitud', event.target.value)}
                    placeholder="Ej: -56.1645"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="hora-captura-placeholder">
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

      <Card className="border-0 bg-light">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <Badge bg="primary" className="mb-2">
                Revisión final
              </Badge>
              <h3 className="h5 mb-1">Resumen previo a finalización</h3>
              <p className="text-secondary mb-0">
                Resumen visual del estado temporal cargado en el frontend.
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

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Stack gap={3}>
            <div>
              <h3 className="h5 mb-1">Finalización visual/simulada</h3>
              <p className="text-secondary mb-0">
                Esta acción no guarda datos, no finaliza en backend y no genera registro real.
              </p>
            </div>

            <Alert variant="secondary" className="mb-0">
              La finalización real queda pendiente para una fase posterior con contrato de guardado.
            </Alert>

            <Button variant="success" onClick={onFinalizarSimulado}>
              Finalizar simulado
            </Button>

            {finalizacionSimulada ? (
              <Alert variant="success" className="mb-0">
                Finalización simulada realizada. No se guardó información real.
              </Alert>
            ) : null}
          </Stack>
        </Card.Body>
      </Card>
    </Stack>
  );
}
