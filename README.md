# Sistema de Relevamiento Territorial para Tablets

Repositorio base del proyecto.

Este sistema permitirá realizar relevamientos territoriales desde tablets, organizando la información por zona, cuadrante, predio, hogares, personas, servicios, salud, observaciones y coordenadas.

## Estado

Bootstrap inicial del repositorio.

## Estructura inicial

```text
docs/
frontend/
backend/
```

## Regla de trabajo

Después del primer commit inicial en `main`, todo cambio deberá hacerse en una rama nueva y mediante Pull Request hacia `main`.

## Publicación frontend en GitHub Pages

El frontend puede publicarse como sitio estático en GitHub Pages mediante GitHub Actions.

La publicación pública debe usar datos mock y no debe depender de backend real, API interna, credenciales, PIN real, tablet/grupo operativo real ni datos reales.

Configuración manual posterior al merge:

~~~text
Settings → Pages → Build and deployment → Source: GitHub Actions
~~~

URL esperada:

~~~text
https://leoalmada-dev.github.io/sistema-relevamiento-territorial/
~~~
