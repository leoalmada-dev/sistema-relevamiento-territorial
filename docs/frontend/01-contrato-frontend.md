# Contrato frontend

## Objetivo

Definir las reglas mínimas para desarrollar el frontend del Sistema de Relevamiento Territorial para Tablets sin depender todavía del contrato backend final.

## Alcance

El frontend debe preparar:

- interfaz para tablets;
- flujo de relevamiento por secciones;
- modelo temporal interno;
- mocks futuros;
- services internos;
- adapters futuros;
- guardado local futuro;
- estados visuales de guardado.

## Qué puede avanzar sin backend

- Flujo de pantallas.
- Estructura de carpetas.
- Modelo temporal frontend.
- Componentes visuales.
- Navegación.
- Mocks separados.
- Services internos.
- Adapters preparados para reemplazo futuro.

## Qué no debe definir todavía

- Endpoints reales.
- Payloads definitivos.
- Nombres finales de atributos backend.
- Validaciones finales del servidor.
- Contrato final de preguardado.
- Mecanismo final de identificación de tablet.
- PIN definitivo.

## Regla principal

Las pantallas no deben depender directamente del backend.

```text
Pantallas React
  ↓
Hooks / estado frontend
  ↓
Modelo temporal frontend
  ↓
Services
  ↓
Adapters
  ↓
Mock actual o API futura
```

## Reglas de trabajo

- No trabajar sobre main.
- Cada tarea debe tener rama propia.
- Cada tarea debe tener contrato aprobado.
- No inventar backend.
- No mezclar UI, lógica de formulario y API en un mismo archivo.
- No crear componentes gigantes.
