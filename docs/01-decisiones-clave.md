# Decisiones clave

## Estado

Documento compartido mínimo para alinear frontend y backend.

## Flujo inicial del cuestionario

El formulario se organiza inicialmente en 4 secciones:

```text
Sección 1 — Inicio, predio y resultado de visita
Sección 2 — Vivienda y hogares
Sección 3 — Personas, contactos, servicios y salud por hogar
Sección 4 — Observaciones, coordenadas y finalización
```

## Regla de corte temprano

La Sección 1 determina si el formulario continúa.

Resultados principales:

```text
ENTREVISTA_REALIZADA
SE_NIEGA
NO_SE_ENCUENTRA
```

Reglas:

- Si el resultado es `SE_NIEGA`, se registra motivo/texto si corresponde y no se continúa.
- Si el resultado es `NO_SE_ENCUENTRA`, se registra referencia, horario, contacto u observación si corresponde y no se continúa.
- Si el resultado es `ENTREVISTA_REALIZADA`, se continúa con secciones 2, 3 y 4.

## Modelo conceptual

```text
Zona
 └── Cuadrante
      └── Predio
           └── Relevamiento
                ├── Vivienda
                ├── Hogares
                │    ├── Personas
                │    ├── Contactos
                │    ├── Servicios
                │    ├── Salud
                │    └── Observaciones del hogar
                ├── Observaciones generales
                └── Coordenadas
```

## Decisiones importantes

- Un predio puede contener más de un hogar.
- El formulario se carga por relevamiento asociado a predio.
- Vivienda queda asociada al relevamiento/predio.
- Personas, contactos, servicios, salud y observaciones del hogar van asociados a cada hogar.
- Puede existir observación general del relevamiento, especialmente en la sección final.
- Las coordenadas quedan asociadas al relevamiento completo.
- No se implementa geolocalización en tiempo real en el MVP.
- No se asumen usuarios personales robustos.
- La trazabilidad será por tablet y grupo operativo.
