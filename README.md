# Windenergy_electrical_diagram.Iot


Single Web App Application IoT & SCADA: UI Interface App for Wind Turbine farms - Nordex - Acciona - Real time Data interaction showed in our Cloud System / Cummulocity.

https://www.nordex-online.com/en/

https://www.softwareag.cloud/site/product/cumulocity-iot.html#/

# Technologies : 

Angular Framework CLI 8
TypeScript,Rest API.
CSS3,HTML5
Node.js
CI:Jenkins.
Git, SourceTree, Microsoft Visio SVG Files.


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.14.


#  Automation Process that Recognize Electrical Diagrams (SVG) and their Objects by the time it’s been uploaded in our Cloud/UI, which is connected with our Wind farms.

## Getting started

**NOTE:** Use nodejs v12.13.1 or newer. It is recommended to use either **nvm** or **nvm-windows** to managed and switch between nodejs versions.

1. Clone the project

    ```sh
    git clone https://nordex-nxos@dev.azure.com/nordex-nxos/UI_electrical_diagram/_git/UI_electrical_diagram
    cd UI_electrical_diagram
    ```

2. Install dependencies
    ```sh
    npm install
    ```

3. Set the Cumulocity environment variables (used both for the dev server and the deployment)

```sh
$env:C8Y_BASEURL = "https://uidev.edge.labor/"
$env:C8Y_TENANT = "edge"
$env:C8Y_USER = "peter_pan"
$env:C8Y_PASSWORD = "n3v3rlAZd"
```

4. Start the dev server

    ```sh
    npm start
    ```

Navigate to `http://localhost:9000/apps/electrical-diagrams/`. The app will automatically reload if you change any of the source files.

## Build

```sh
npm run build
```

## Deploy

**Note:** The Cumulocity environment variables need to be set before calling this command

```sh
npm run deploy
```

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
