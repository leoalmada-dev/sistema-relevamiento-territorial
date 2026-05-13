import { Badge, Button, Card, Col, ProgressBar, Row, Stack } from 'react-bootstrap';
import type { RelevamientoSection, RelevamientoSectionId } from '../types/relevamientoFlow';

type SectionStepperProps = {
  sections: RelevamientoSection[];
  currentSectionId: RelevamientoSectionId;
  onSelectSection: (sectionId: RelevamientoSectionId) => void;
  isSectionDisabled?: (section: RelevamientoSection) => boolean;
};

export function SectionStepper({
  sections,
  currentSectionId,
  onSelectSection,
  isSectionDisabled,
}: SectionStepperProps) {
  const currentSection = sections.find((section) => section.id === currentSectionId);
  const currentOrder = currentSection?.order ?? 1;
  const progress = Math.round((currentOrder / sections.length) * 100);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Stack gap={3}>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Avance del relevamiento</span>
              <Badge bg="primary">
                Sección {currentOrder} de {sections.length}
              </Badge>
            </div>

            <ProgressBar now={progress} label={`${progress}%`} />
          </div>

          <Row className="g-2">
            {sections.map((section) => {
              const isActive = section.id === currentSectionId;
              const disabled = isSectionDisabled?.(section) ?? false;

              return (
                <Col md={6} xl={3} key={section.id}>
                  <Button
                    className="w-100 text-start h-100"
                    variant={isActive ? 'primary' : 'outline-secondary'}
                    onClick={() => onSelectSection(section.id)}
                    disabled={disabled}
                  >
                    <span className="d-block small">Sección {section.order}</span>
                    <span className="d-block fw-semibold">{section.title}</span>
                  </Button>
                </Col>
              );
            })}
          </Row>
        </Stack>
      </Card.Body>
    </Card>
  );
}
