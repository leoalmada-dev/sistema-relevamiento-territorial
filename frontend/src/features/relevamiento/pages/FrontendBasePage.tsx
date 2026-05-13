import { Alert, Badge, Button, Card, Col, Container, ListGroup, Row } from 'react-bootstrap';

export function FrontendBasePage() {
  return (
    <main className="bg-light min-vh-100 py-4">
      <Container>
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white border-0 pt-4 px-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
              <div>
                <Badge bg="primary" className="mb-3">
                  FE-1 · Base técnica frontend
                </Badge>
                <h1 className="h2 mb-2">Sistema de Relevamiento Territorial</h1>
                <p className="text-secondary mb-0">
                  Frontend inicial para tablets creado con React, Vite, TypeScript,
                  Bootstrap y React-Bootstrap.
                </p>
              </div>

              <div className="text-md-end">
                <Badge bg="success">Base lista</Badge>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Alert variant="info" className="mb-4">
              Esta pantalla solo valida que la base técnica levanta correctamente.
              No implementa todavía el formulario real ni integración con backend.
            </Alert>

            <Row className="g-4">
              <Col md={6}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>Incluido en FE-1</Card.Title>
                    <ListGroup variant="flush">
                      <ListGroup.Item>React + Vite + TypeScript.</ListGroup.Item>
                      <ListGroup.Item>Bootstrap + React-Bootstrap.</ListGroup.Item>
                      <ListGroup.Item>Estructura inicial en frontend/src.</ListGroup.Item>
                      <ListGroup.Item>Pantalla mínima institucional.</ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>No incluido todavía</Card.Title>
                    <ListGroup variant="flush">
                      <ListGroup.Item>Formulario real.</ListGroup.Item>
                      <ListGroup.Item>Mocks funcionales.</ListGroup.Item>
                      <ListGroup.Item>Services o adapters reales.</ListGroup.Item>
                      <ListGroup.Item>Conexión con backend.</ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4">
              <Button variant="outline-primary" disabled>
                Próxima etapa: flujo frontend
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}
