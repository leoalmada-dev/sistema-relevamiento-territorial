import type { ReactNode } from 'react';
import { Alert, Badge, Card, ListGroup, Stack } from 'react-bootstrap';
import type { RelevamientoSection } from '../types/relevamientoFlow';

type SectionPlaceholderProps = {
  section: RelevamientoSection;
  children?: ReactNode;
};

export function SectionPlaceholder({ section, children }: SectionPlaceholderProps) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0 pt-4 px-4">
        <Badge bg="secondary" className="mb-3">
          Placeholder funcional
        </Badge>
        <h2 className="h4 mb-2">
          Sección {section.order} — {section.title}
        </h2>
        <p className="text-secondary mb-0">{section.description}</p>
      </Card.Header>

      <Card.Body className="p-4">
        <Stack gap={3}>
          <Alert variant="warning" className="mb-0">
            FE-3 agrega selección territorial con mocks locales. No hay formulario real,
            creación de relevamiento ni integración con backend.
          </Alert>

          {children}

          <ListGroup>
            {section.includes.map((item) => (
              <ListGroup.Item key={item}>{item}</ListGroup.Item>
            ))}
          </ListGroup>
        </Stack>
      </Card.Body>
    </Card>
  );
}
