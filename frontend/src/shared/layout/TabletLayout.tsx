import type { ReactNode } from 'react';
import { Badge, Container, Navbar } from 'react-bootstrap';

type TabletLayoutProps = {
  children: ReactNode;
};

export function TabletLayout({ children }: TabletLayoutProps) {
  return (
    <main className="bg-light min-vh-100">
      <Navbar bg="white" className="border-bottom shadow-sm">
        <Container fluid="lg">
          <Navbar.Brand className="fw-semibold">
            Sistema de Relevamiento Territorial
          </Navbar.Brand>
          <Badge bg="info" text="dark">
            Tablet · MVP
          </Badge>
        </Container>
      </Navbar>

      <Container fluid="lg" className="py-4">
        {children}
      </Container>
    </main>
  );
}
