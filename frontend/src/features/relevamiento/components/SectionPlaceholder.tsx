import type { ReactNode } from 'react';
import { Card, Stack } from 'react-bootstrap';
import type { RelevamientoSection } from '../types/relevamientoFlow';

type SectionPlaceholderProps = {
  section: RelevamientoSection;
  children?: ReactNode;
};

export function SectionPlaceholder({ section, children }: SectionPlaceholderProps) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0 pt-4 px-4">
        <h2 className="h4 mb-2">
          Sección {section.order} — {section.title}
        </h2>
        <p className="text-secondary mb-0">{section.description}</p>
      </Card.Header>

      <Card.Body className="p-4">
        <Stack gap={3}>{children}</Stack>
      </Card.Body>
    </Card>
  );
}
