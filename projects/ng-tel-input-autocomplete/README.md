# Angular International Telephone Input & Contact Autocomplete (`ng-tel-input-autocomplete`)

[![npm version](https://img.shields.io/npm/v/ng-tel-input-autocomplete.svg)](https://www.npmjs.com/package/ng-tel-input-autocomplete)
[![Angular](https://img.shields.io/badge/angular-21-dd0031.svg)](https://angular.dev/)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ng-tel-input-autocomplete.svg)](https://bundlephobia.com/package/ng-tel-input-autocomplete)
[![Documentation](https://img.shields.io/badge/docs-GitBook-blue)](https://subhrangsu.gitbook.io/ng-tel-input-autocomplete)
[![Demo](https://img.shields.io/badge/demo-Vercel-success)](https://my-workspace-chi-eight.vercel.app)

Accessible international telephone input and contact autocomplete for Angular 21. Supports Reactive Forms, template-driven forms, country filtering, validation, formatting, keyboard navigation, asynchronous suggestions, RTL layouts, and optional paginated country APIs.

## Installation

```bash
npm install ng-tel-input-autocomplete @angular/cdk
```

Angular, Angular Forms, CDK, and RxJS are peer dependencies. Optionally install `google-libphonenumber` and `intl-tel-input` for enhanced phone metadata, formatting, and validation.

## Quick start

```ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgTelInputAutocomplete, PhoneInputValue } from 'ng-tel-input-autocomplete';

@Component({
  selector: 'app-phone-field',
  imports: [ReactiveFormsModule, NgTelInputAutocomplete],
  template: `
    <label for="customer-phone">Phone</label>
    <ng-tel-input-autocomplete inputId="customer-phone" [formControl]="phone" defaultCountry="US" />
  `,
})
export class PhoneField {
  readonly phone = new FormControl<PhoneInputValue>(null);
}
```

## Application-wide defaults

```ts
import { provideNgTelInputAutocomplete } from 'ng-tel-input-autocomplete';

export const appConfig = {
  providers: [
    provideNgTelInputAutocomplete({
      defaultCountry: 'IN',
      flagMode: 'emoji',
      validationEnabled: true,
      preferredCountries: ['IN', 'US'],
    }),
  ],
};
```

## Contact autocomplete

```html
<ng-tel-input-autocomplete
  [formControl]="phone"
  [suggestions]="suggestions"
  [suggestionsLoading]="loading"
  (suggestionSearch)="searchContacts($event)"
  (loadMoreSuggestions)="loadNextPage()"
/>
```

## Documentation

Full API reference, inputs, outputs, templates, theme tokens, styling, CSP, accessibility, and more:

- 📖 [GitBook Documentation](https://subhrangsu.gitbook.io/ng-tel-input-autocomplete)
- 📋 [API Reference on GitHub](https://github.com/Subhrangsu90/tel-input-autocomplete/blob/master/projects/ng-tel-input-autocomplete/API.md)

## Links

- Demo: [Live Playground](https://my-workspace-chi-eight.vercel.app)
- Repository: [Subhrangsu90/tel-input-autocomplete](https://github.com/Subhrangsu90/tel-input-autocomplete)
- npm: [ng-tel-input-autocomplete](https://www.npmjs.com/package/ng-tel-input-autocomplete)

## License

MIT
