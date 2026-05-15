# Pendientes y preguntas

## Objetivo

Registrar decisiones abiertas que no deben inventarse durante el desarrollo.

## Backend/API

- Definir payload de `POST /api/relevamientos`.
- Definir payload de `PATCH /api/relevamientos/{id}/borrador`.
- Definir payload de `POST /api/relevamientos/{id}/finalizar`.
- Definir estructura de errores.
- Definir estados finales del relevamiento.
- Definir si el backend guarda borradores por sección o documento completo.
- Definir cómo se recupera un borrador existente.

## Modelo de datos

- Confirmar modelo final de Zona, Cuadrante y Predio.
- Confirmar datos precargados del predio.
- Confirmar relación final entre Predio, Relevamiento, Vivienda y Hogares.
- Confirmar campos definitivos de Hogar.
- Confirmar campos definitivos de Persona.
- Confirmar campos definitivos de Contactos, Servicios y Salud por hogar.
- Confirmar alcance de observaciones generales.

## Frontend

- Definir estructura final de pantallas.
- Definir modelo temporal frontend.
- Definir estrategia de guardado local.
- Definir estados visuales de guardado, error, pendiente y finalizado.
- Definir cómo se mostrará el corte temprano de Sección 1.

## Operación

- Definir cómo se identifica la tablet.
- Definir si habrá PIN simple.
- Definir cómo se asocia tablet con grupo operativo.
- Definir si la asociación se administra por base de datos o panel mínimo.

## Coordenadas

- Confirmar si las coordenadas son obligatorias para finalizar.
- Definir qué pasa si falla la captura de coordenadas.
- Definir si habrá pin manual, geolocalización automática o ambas.

## Fuera del MVP por ahora

- Usuarios personales robustos.
- App móvil nativa.
- Geolocalización en tiempo real.
- Mapa avanzado.
- Reportes complejos.
- Gráficas.
- Acceso externo de Intendencia.
- Offline completo de varios días.

## Pendientes API-1A — Borrador de relevamiento

Quedan pendientes de definición antes de implementar relevamientos reales:

- cómo se identifica `tablet_id`;
- cómo se asocia `grupo_operativo_id`;
- si backend infiere tablet/grupo operativo o si frontend debe enviarlo;
- si habrá PIN simple y cómo afecta la creación del relevamiento;
- si `PENDIENTE_REVISITA` entra en MVP;
- si `ANULADO` entra en MVP;
- si `SE_NIEGA` y `NO_SE_ENCUENTRA` finalizan el relevamiento o quedan en otro estado;
- si las coordenadas son obligatorias para todos los casos;
- qué validaciones son obligatorias al finalizar;
- si backend normaliza hogares/personas/contactos/servicios/salud al finalizar o conserva inicialmente el JSON;
- qué errores debe devolver backend ante borrador inválido, sección inválida o relevamiento inexistente.

No cerrar estas decisiones dentro de API-1A sin nuevo contrato.
