export type RelevamientoSectionId =
  | 'inicio-predio-visita'
  | 'vivienda-hogares'
  | 'datos-por-hogar'
  | 'cierre-finalizacion';

export type RelevamientoSection = {
  id: RelevamientoSectionId;
  order: number;
  title: string;
  description: string;
  includes: string[];
};
