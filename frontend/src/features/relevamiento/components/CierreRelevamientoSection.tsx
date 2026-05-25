import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Stack } from 'react-bootstrap';
import { ResumenRelevamiento } from './ResumenRelevamiento';
import type { CierreRelevamientoFormState } from '../types/cierreRelevamiento';
import type { PersonasContactosPorHogarState } from '../types/personaContacto';
import type { ResultadoVisitaFormState } from '../types/resultadoVisita';
import type { PredioDetalle } from '../types/territorio';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

type CierreRelevamientoModo = 'completo' | 'corte-temprano';

type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

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

function formatCurrentTimeForInput(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Permiso de ubicación denegado o no disponible.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'No se pudo obtener la ubicación. Verifique señal GPS o conexión del dispositivo.';
  }

  if (error.code === error.TIMEOUT) {
    return 'No se pudo obtener la ubicación dentro del tiempo esperado.';
  }

  return 'No se pudo obtener la ubicación.';
}

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
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');
  const [geolocationMessage, setGeolocationMessage] = useState('');

  const esCorteTemprano = modo === 'corte-temprano';

  const updateCierre = (updates: Partial<CierreRelevamientoFormState>) => {
    onCierreChange({
      ...cierre,
      ...updates,
    });
  };

  const updateField = <Field extends keyof CierreRelevamientoFormState>(
    field: Field,
    value: CierreRelevamientoFormState[Field],
  ) => {
    updateCierre({ [field]: value });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationStatus('error');
      setGeolocationMessage('Este dispositivo/navegador no permite geolocalización.');
      return;
    }

    setGeolocationStatus('loading');
    setGeolocationMessage('Obteniendo ubicación...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        updateCierre({
          latitud: formatCoordinate(latitude),
          longitud: formatCoordinate(longitude),
          horaCaptura: cierre.horaCaptura || formatCurrentTimeForInput(),
        });

        setGeolocationStatus('success');
        setGeolocationMessage('Ubicación cargada correctamente.');
      },
      (error) => {
        setGeolocationStatus('error');
        setGeolocationMessage(getGeolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
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
                Use la ubicación actual de la tablet o complete la ubicación manualmente.
              </p>
            </div>

            <Alert variant="warning" className="mb-0">
              Si la tablet no permite obtener la ubicación, complete latitud, longitud y hora de captura manualmente.
            </Alert>

            <div>
              <Button
                type="button"
                variant="outline-primary"
                onClick={handleUseCurrentLocation}
                disabled={geolocationStatus === 'loading'}
              >
                {geolocationStatus === 'loading' ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Obteniendo ubicación...
                  </>
                ) : (
                  'Usar ubicación actual de la tablet'
                )}
              </Button>
            </div>

            {geolocationStatus !== 'idle' && geolocationMessage ? (
              <Alert
                variant={geolocationStatus === 'success' ? 'success' : geolocationStatus === 'loading' ? 'info' : 'danger'}
                className="mb-0"
              >
                {geolocationMessage}
              </Alert>
            ) : null}

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="latitud-a-confirmar">
                  <Form.Label>Latitud</Form.Label>
                  <Form.Control
                    value={cierre.latitud}
                    onChange={(event) => updateField('latitud', event.target.value)}
                    placeholder="Ej: -34.9011"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="longitud-a-confirmar">
                  <Form.Label>Longitud</Form.Label>
                  <Form.Control
                    value={cierre.longitud}
                    onChange={(event) => updateField('longitud', event.target.value)}
                    placeholder="Ej: -56.1645"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="hora-captura-a-confirmar">
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
