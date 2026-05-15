# Flujo de pantallas

## Estado actual de integración territorial

- FE-10A integra lectura territorial real configurable por entorno.
- Base API documentada: `http://10.100.0.10/sistema-censo/api/v1`.
- Rutas integradas:
  - `/zonas`
  - `/zonas/{id}/cuadrantes`
  - `/cuadrantes/{id}/predios`
  - `/predios/{id}`
- JSON real confirmado:
  - zonas: `id`, `nombre`
  - cuadrantes: `id`, `nombre`, `img`
  - predios: `id`, `calle`, `nro_puerta`, `padron`, `lote`, `manzana`, `obs`, `nombre_cuadrante`
- Los mocks siguen disponibles para desarrollo sin red interna.
- No hay fallback silencioso: si la API falla, la UI muestra error claro.
- Desde terminal con proxy institucional puede requerirse `curl --noproxy "*"` para evitar bloqueo Fortinet sobre rutas internas.
- Relevamientos, guardado servidor, borrador servidor y finalización real no están integrados todavía.
- CORS, certificado o red interna quedan como posibles pendientes de infraestructura/backend.


## Estado actual de la Sección 1

- La Sección 1 ya incluye selección territorial con mocks.
- La Sección 1 ya permite elegir `ENTREVISTA_REALIZADA`, `SE_NIEGA` y `NO_SE_ENCUENTRA`.
- `ENTREVISTA_REALIZADA` permite avanzar a Sección 2.
- `SE_NIEGA` y `NO_SE_ENCUENTRA` muestran campos simples y bloquean el avance al formulario completo.
- No hay guardado real, backend conectado ni borrador local todavía.

## Estado actual de la Sección 2

- La Sección 2 ya permite cargar datos de vivienda.
- La Sección 2 ya permite agregar, editar, listar y eliminar hogares en memoria React.
- No hay persistencia local todavía.
- No hay backend conectado.
- No hay personas, contactos, servicios ni salud todavía.

## Estado actual de la Sección 3

- La Sección 3 ya permite seleccionar un hogar cargado en Sección 2.
- La Sección 3 ya permite agregar, editar, listar y eliminar personas asociadas a cada hogar.
- La Sección 3 ya permite agregar, editar, listar y eliminar contactos asociados a cada hogar.
- La Sección 3 ya permite cargar servicios y salud asociados a cada hogar.
- El objetivo inicial de contactos es cargar hasta dos por hogar.
- No hay persistencia local todavía.
- No hay backend conectado.
- No hay coordenadas ni finalización real todavía.

## Estado actual de la Sección 4

- La Sección 4 ya permite cargar observaciones generales.
- La Sección 4 ya permite cargar latitud, longitud y hora de captura como placeholder.
- La Sección 4 ya muestra revisión final visual del relevamiento.
- La Sección 4 ya permite una finalización simulada sin guardado real.
- No hay geolocalización real, mapa real ni pin real.
- No hay persistencia local todavía.
- No hay backend conectado.
- No hay finalización real todavía.

## Estado actual de borrador local

- FE-9 agrega borrador local MVP usando `localStorage`.
- El borrador local permite continuar o descartar un único borrador activo.
- La key usada es `relevamientoTerritorial:draft:v1`.
- No es offline completo.
- No es guardado en servidor.
- Puede contener datos personales o sensibles y requiere tablets autorizadas/controladas.
- No hay sincronización con backend ni guardado final real todavía.

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
