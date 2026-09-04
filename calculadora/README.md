# Calculadora

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Levantarlo con Docker

El `Dockerfile` de este módulo **no está en esta carpeta**, sino en
`docker/calculadora.Dockerfile`, junto al resto del stack.

Es a propósito: el pipeline de despliegue (`.github/workflows/main.yml`) entra en
esta carpeta y ejecuta `docker compose` contra la configuración que vive en el
servidor. Docker busca el archivo de configuración subiendo por las carpetas
superiores, así que cualquier compose que se añada por encima le tapa el suyo y
rompe el despliegue con `no such service: calculadora-ris3cat`.

Para arrancar todo el entorno (base de datos incluida):

```bash
cd ../docker && docker compose up -d
```
