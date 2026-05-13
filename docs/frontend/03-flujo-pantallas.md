# Flujo de pantallas

## Estado actual de la Sección 1

- La Sección 1 ya incluye selección territorial con mocks.
- La Sección 1 ya permite elegir `ENTREVISTA_REALIZADA`, `SE_NIEGA` y `NO_SE_ENCUENTRA`.
- `ENTREVISTA_REALIZADA` permite avanzar a Sección 2.
- `SE_NIEGA` y `NO_SE_ENCUENTRA` muestran campos simples y bloquean el avance al formulario completo.
- No hay guardado real, backend conectado ni borrador local todavía.

## Objetivo

Definir el flujo inicial de pantallas alineado con las 4 secciones acordadas en DOCS-0.

## Secciones del cuestionario

```text
Sección 1 — Inicio, predio y resultado de visita
Sección 2 — Vivienda y hogares
Sección 3 — Personas, contactos, servicios y salud por hogar
Sección 4 — Observaciones, coordenadas y finalización
```

## Pantallas iniciales

1. Acceso / tablet / PIN pendiente.
2. Selección de zona.
3. Selección de cuadrante.
4. Selección de predio.
5. Inicio o recuperación de relevamiento.
6. Resultado de visita.
7. Vivienda.
8. Hogares.
9. Personas por hogar.
10. Contactos por hogar.
11. Servicios por hogar.
12. Salud por hogar.
13. Observaciones por hogar.
14. Observaciones generales.
15. Coordenadas.
16. Revisión final.
17. Confirmación de guardado.

## Corte temprano

La pantalla de resultado de visita define si continúa el formulario.

Opciones iniciales:

```text
ENTREVISTA_REALIZADA
SE_NIEGA
NO_SE_ENCUENTRA
```

Reglas:

- `ENTREVISTA_REALIZADA`: continúa a vivienda, hogares y resto del formulario.
- `SE_NIEGA`: registra motivo u observación y pasa a cierre.
- `NO_SE_ENCUENTRA`: registra referencia, horario, contacto u observación y pasa a cierre.

## MVP

MVP inicial:

- selección territorial;
- inicio/recuperación;
- resultado de visita;
- vivienda;
- hogares múltiples;
- personas por hogar;
- contactos/servicios/salud por hogar;
- observaciones;
- coordenadas como pantalla básica;
- confirmación final.

Placeholder inicial:

- PIN;
- identificación real de tablet;
- mapa avanzado;
- panel operativo;
- integración backend real.
