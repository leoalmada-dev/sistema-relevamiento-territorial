# Fases frontend

## Estado actual frontend

- FE-1 completado: base técnica frontend.
- FE-2 completado: layout tablet y navegación inicial.
- FE-3 completado: selección territorial con mocks.
- FE-4 completado: resultado de visita y corte temprano visual.
- FE-5 completado: vivienda y hogares con estado temporal.
- La Sección 1 ya incluye selección territorial con mocks y resultado de visita.
- La Sección 2 ya permite cargar datos de vivienda.
- La Sección 2 ya permite agregar, editar, listar y eliminar hogares en memoria React.
- No hay persistencia local todavía.
- No hay backend conectado.
- No hay personas, contactos, servicios ni salud todavía.
- Próximo paso recomendado: personas/contactos por hogar o guardado local, según se defina.

## FE-0 — Documentación mínima frontend

Objetivo: crear los documentos mínimos del frontend.

Alcance: contrato, estructura, flujo, modelo temporal, integración pendiente y fases.

Fuera de alcance: código, app React, dependencias, mocks implementados.

Resultado esperado: documentación lista para iniciar frontend.

Dependencias: DOCS-0.

## FE-1 — Estructura base frontend

Objetivo: crear base técnica del frontend.

Alcance: estructura inicial, carpetas, layout base y rutas si corresponde.

Fuera de alcance: formulario completo, API real, dependencias no aprobadas.

Resultado esperado: frontend inicial ordenado.

Dependencias: FE-0.

## FE-2 — Layout tablet y navegación

Objetivo: crear flujo navegable pensado para tablets.

Alcance: layout, navegación, avance/retroceso y contenedores.

Fuera de alcance: campos definitivos y backend real.

Resultado esperado: recorrido visual inicial.

Dependencias: FE-1.

## FE-3 — Selección territorial con mocks

Objetivo: seleccionar zona, cuadrante y predio con datos simulados.

Alcance: mocks, services internos y pantallas de selección.

Fuera de alcance: endpoints reales.

Resultado esperado: selección territorial funcional.

Dependencias: FE-2.

## FE-4 — Formulario por secciones

Objetivo: implementar flujo de las 4 secciones.

Alcance: resultado de visita, vivienda, hogares, datos por hogar, observaciones y coordenadas básicas.

Fuera de alcance: validaciones finales y backend real.

Resultado esperado: formulario navegable por secciones.

Dependencias: FE-3.

## FE-5 — Hogares múltiples

Objetivo: soportar varios hogares por predio.

Alcance: agregar hogares y cargar personas, contactos, servicios, salud y observaciones por hogar.

Fuera de alcance: modelo backend definitivo.

Resultado esperado: relevamiento con múltiples hogares.

Dependencias: FE-4.

## FE-6 — Borrador local y estados visuales

Objetivo: evitar pérdida de datos y mostrar estado de guardado.

Alcance: guardado local, recuperación, guardando, guardado, pendiente, error y finalizado.

Fuera de alcance: sincronización offline compleja.

Resultado esperado: borrador recuperable y estados claros.

Dependencias: FE-5.

## FE-7 — Coordenadas y cierre

Objetivo: preparar cierre del relevamiento.

Alcance: coordenadas básicas, observaciones generales, revisión final y confirmación.

Fuera de alcance: mapa avanzado y tracking en tiempo real.

Resultado esperado: flujo completo hasta cierre simulado.

Dependencias: FE-6.

## FE-8 — Integración backend real

Objetivo: reemplazar mocks por API real cuando exista contrato.

Alcance: ajustar services, adapters y types si corresponde.

Fuera de alcance: rediseñar todo el flujo sin justificación.

Resultado esperado: frontend conectado al backend.

Dependencias: contrato backend final.
