# Angular International Telephone Input Workspace (`ng-tel-input-autocomplete`)

[![npm downloads](https://img.shields.io/npm/dw/ng-tel-input-autocomplete.svg)](https://www.npmjs.com/package/ng-tel-input-autocomplete)
[![npm version](https://img.shields.io/npm/v/ng-tel-input-autocomplete.svg)](https://www.npmjs.com/package/ng-tel-input-autocomplete)
[![Angular](https://img.shields.io/badge/angular-21-dd0031.svg)](https://angular.dev/)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ng-tel-input-autocomplete.svg)](https://bundlephobia.com/package/ng-tel-input-autocomplete)
[![Documentation](https://img.shields.io/badge/docs-GitBook-blue)](https://subhrangsu.gitbook.io/ng-tel-input-autocomplete)
[![Demo](https://img.shields.io/badge/demo-Vercel-success)](https://my-workspace-chi-eight.vercel.app)

Professional Angular library workspace for `ng-tel-input-autocomplete`, an accessible international telephone input with country selection, phone-number formatting, validation, and optional contact autocomplete.

This repository contains the published Angular library, GitBook-ready documentation, and a static demo application that can be deployed to Vercel.

## Project Links

- Demo: [Live Playground](https://my-workspace-chi-eight.vercel.app)
- Repository: [Subhrangsu90/tel-input-autocomplete](https://github.com/Subhrangsu90/tel-input-autocomplete)
- Library source: [projects/ng-tel-input-autocomplete](./projects/ng-tel-input-autocomplete)
- GitBook docs source: [docs](./docs)
- Library README: [projects/ng-tel-input-autocomplete/README.md](./projects/ng-tel-input-autocomplete/README.md)
- API reference: [projects/ng-tel-input-autocomplete/API.md](./projects/ng-tel-input-autocomplete/API.md)
- npm package: [ng-tel-input-autocomplete](https://www.npmjs.com/package/ng-tel-input-autocomplete)

## What This Library Provides

`ng-tel-input-autocomplete` is built for production Angular forms that need international phone entry without giving up accessibility or customization.

Key capabilities:

- Standalone Angular component for Angular 21+
- Reactive Forms, template-driven forms, and Signal Forms compatible control contract
- Country picker with search, keyboard support, and optional remote pagination
- Formatting and validation powered by `google-libphonenumber`
- Country metadata powered by `intl-tel-input`
- Optional contact autocomplete controlled by the consuming application
- String or object output formats
- Emoji or image flag modes
- Design-system-friendly CSS custom properties
- Accessible combobox/listbox semantics
- Static Angular demo ready for Vercel deployment

## Repository Structure

```text
.
|-- projects/
|   |-- demo/                         # Angular demo app deployed to Vercel
|   `-- ng-tel-input-autocomplete/    # Library source, README, API docs, package metadata
|-- dist/                             # Generated build output
|-- angular.json                      # Angular workspace configuration
|-- package.json                      # Workspace scripts and dependencies
|-- vercel.json                       # Vercel static deployment configuration
`-- README.md                         # Workspace and deployment documentation
```

## Requirements

| Tool    | Version                                  |
| ------- | ---------------------------------------- |
| Node.js | `20.19+`, `22.12+`, or `24+`             |
| npm     | `11.6.4` as declared by `packageManager` |
| Angular | `21.x`                                   |

Install dependencies from the repository root:

```bash
npm install
```

## Local Development

Start the demo application:

```bash
npm start
```

Then open:

```text
http://localhost:4200/
```

Build only the library:

```bash
npm run build:lib
```

Build only the demo app:

```bash
npm run build:demo
```

Build everything:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run the full library verification flow:

```bash
npm run verify:lib
```

`verify:lib` runs the library tests, builds the library, builds the demo, and performs an npm package dry run from `dist/ng-tel-input-autocomplete`.

## Using The Library In An Angular App

Install the package:

```bash
npm install ng-tel-input-autocomplete @angular/cdk
```

Use the standalone component with Reactive Forms:

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTelInputAutocomplete, PhoneInputValue } from 'ng-tel-input-autocomplete';

@Component({
  selector: 'app-contact-phone',
  imports: [ReactiveFormsModule, NgTelInputAutocomplete],
  template: `
    <label for="contact-phone">Phone</label>
    <ng-tel-input-autocomplete
      inputId="contact-phone"
      [formControl]="phone"
      defaultCountry="IN"
      [suggestionsEnabled]="false"
    />
  `,
})
export class ContactPhoneComponent {
  readonly phone = new FormControl<PhoneInputValue>(null, {
    validators: [Validators.required],
  });
}
```

Set app-wide defaults during bootstrap:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNgTelInputAutocomplete } from 'ng-tel-input-autocomplete';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgTelInputAutocomplete({
      defaultCountry: 'IN',
      outputFormat: 'string',
      validationEnabled: true,
      suggestionsEnabled: true,
      flagMode: 'emoji',
    }),
  ],
};
```

For the complete consumer documentation, see the [library README](./projects/ng-tel-input-autocomplete/README.md). For every input, output, type, provider, and service method, see the [API reference](./projects/ng-tel-input-autocomplete/API.md).

## GitBook Documentation

The documentation source for GitBook lives in [`docs/`](./docs). GitBook is configured with [`.gitbook.yaml`](./.gitbook.yaml):

```yaml
root: ./docs/

structure:
  readme: README.md
  summary: SUMMARY.md
```

When connecting this repository in GitBook, keep the project directory at the repository root so GitBook can find `.gitbook.yaml`. The written docs are intended for GitBook; the Angular app remains the live demo for Vercel.

## Demo Application

The demo app lives in `projects/demo` and showcases:

- Interactive Reactive Forms playground
- Contact autocomplete examples
- Template-driven form integration
- Object and string output formats
- Disabled, readonly, validation, and clear states
- Styling, sizes, variants, flag modes, and CSS theme tokens
- Advanced country filtering and event logging

Production build output is generated at:

```text
dist/demo/browser
```

## Documentation Map

| Document                                                          | Purpose                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| [README.md](./README.md)                                          | Workspace, demo, deployment, and quick usage                         |
| [Library README](./projects/ng-tel-input-autocomplete/README.md)  | Consumer guide for the npm package                                   |
| [API.md](./projects/ng-tel-input-autocomplete/API.md)             | Complete component, provider, type, event, template, and service API |
| [CHANGELOG.md](./projects/ng-tel-input-autocomplete/CHANGELOG.md) | Release history                                                      |

## License

MIT. See [projects/ng-tel-input-autocomplete/LICENSE](./projects/ng-tel-input-autocomplete/LICENSE).
