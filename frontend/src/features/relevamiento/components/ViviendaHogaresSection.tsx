import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap';
import { HogarFormCard } from './HogarFormCard';
import type { HogarFormState, ViviendaFormState } from '../types/viviendaHogar';

const MAX_HOGARES_DECLARADOS = 5;

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
  const cantidadExcedeMaximo =
    tieneCantidadDeclarada && cantidadDeclarada > MAX_HOGARES_DECLARADOS;
  const hogaresPendientes = Math.max(cantidadDeclarada - hogares.length, 0);
  const hogaresExcedidos = Math.max(hogares.length - cantidadDeclarada, 0);

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
                Complete los datos generales de vivienda para ordenar la carga de hogares.
              </p>
            </div>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="cantidad-hogares-declarada">
                  <Form.Label>Cantidad de hogares declarada *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={MAX_HOGARES_DECLARADOS}
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
                  <Form.Label>Vínculo entre hogares *</Form.Label>
                  <Form.Select
                    value={vivienda.vinculoEntreHogares}
                    onChange={(event) =>
                      updateViviendaField('vinculoEntreHogares', event.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="FAMILIARES">Familiares</option>
                    <option value="UNIDADES_INDEPENDIENTES">Unidades independientes</option>
                    <option value="OTROS">Otros</option>
                  </Form.Select>
                  <Form.Text className="text-secondary">
                    Obligatorio si hay más de un hogar.
                  </Form.Text>
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
                placeholder="Ingrese observaciones generales de vivienda si corresponde."
              />
              <Form.Text className="text-secondary">
                Utilice este campo para aclarar situaciones de la vivienda o de la composición
                del predio que no queden reflejadas en las respuestas anteriores, especialmente
                cuando existan dudas sobre la cantidad de hogares o la forma de convivencia.
              </Form.Text>
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
                  Permite agregar, editar, listar y eliminar hogares durante la carga.
                </p>
              </div>

              <div>
                <Button variant="primary" onClick={onAddHogar}>
                  Agregar hogar
                </Button>
              </div>
            </div>

            {!tieneCantidadDeclarada ? (
              <Alert variant="secondary" className="mb-0">
                Indicá la cantidad declarada y agregá los hogares correspondientes.
              </Alert>
            ) : cantidadExcedeMaximo ? (
              <Alert variant="warning" className="mb-0">
                Para el MVP se permite cargar hasta <strong>{MAX_HOGARES_DECLARADOS}</strong>{' '}
                hogares por predio. Si encontrás un caso mayor, dejalo registrado en
                observaciones y consultá antes de continuar.
              </Alert>
            ) : cantidadCoincide ? (
              <Alert variant="success" className="mb-0">
                La cantidad de hogares cargados coincide con la cantidad declarada:{' '}
                <strong>{hogares.length}</strong>.
              </Alert>
            ) : cantidadDeclarada > hogares.length ? (
              <Alert variant="warning" className="mb-0">
                Faltan cargar <strong>{hogaresPendientes}</strong>{' '}
                {hogaresPendientes === 1 ? 'hogar' : 'hogares'} para coincidir con la
                cantidad declarada. Hogares declarados: <strong>{cantidadDeclarada}</strong>.
                Hogares cargados: <strong>{hogares.length}</strong>.
              </Alert>
            ) : (
              <Alert variant="warning" className="mb-0">
                Hay <strong>{hogaresExcedidos}</strong>{' '}
                {hogaresExcedidos === 1 ? 'hogar cargado de más' : 'hogares cargados de más'}.
                Hogares declarados: <strong>{cantidadDeclarada}</strong>. Hogares cargados:{' '}
                <strong>{hogares.length}</strong>. Revisá si corresponde ajustar la cantidad
                declarada o los hogares cargados.
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
