import { Alert, Badge, Card, ListGroup } from 'react-bootstrap';
import type { RelevamientoSection } from '../types/relevamientoFlow';

type SectionPlaceholderProps = {
  section: RelevamientoSection;
};

export function SectionPlaceholder({ section }: SectionPlaceholderProps) {
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
        <Alert variant="warning">
          FE-2 solo define navegación y estructura visual. No hay formulario real,
          campos definitivos, mocks ni conexión con backend.
        </Alert>

        <ListGroup>
          {section.includes.map((item) => (
            <ListGroup.Item key={item}>{item}</ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
