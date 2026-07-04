# Documentation

Accessible international telephone input and contact autocomplete for Angular 21. The standalone component supports Reactive Forms, template-driven forms, country filtering, validation, formatting, keyboard navigation, asynchronous suggestions, RTL layouts, and optional paginated country APIs.

## Compatibility

| Library | Angular | Node.js                |
| ------- | ------- | ---------------------- |
| 0.1.x   | 21.x    | 20.19+, 22.12+, or 24+ |

## Installation

```bash
npm install ng-tel-input-autocomplete @angular/cdk
```

Angular, Angular Forms, CDK, and RxJS are peer dependencies. The package installs `google-libphonenumber` and `intl-tel-input` for phone metadata, formatting, and validation.

No Tailwind, global stylesheet, or external flag service is required. Styles are encapsulated in the components and emoji flags are the default.

For the complete properties, emitters, templates, interfaces, keyboard behavior, and service methods, see the [API reference](api-reference.md).

## Quick start

Import the standalone component where it is used:

```ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgTelInputAutocomplete, PhoneInputValue } from 'ng-tel-input-autocomplete';

@Component({
  selector: 'app-phone-field',
  imports: [ReactiveFormsModule, NgTelInputAutocomplete],
  template: `
    <label for="customer-phone">Phone</label>
    <ng-tel-input-autocomplete
      inputId="customer-phone"
      [formControl]="phone"
      defaultCountry="US"
    />
  `,
})
export class PhoneField {
  readonly phone = new FormControl<PhoneInputValue>(null);
}
```

For template-driven forms, import `FormsModule` and bind with `[(ngModel)]`.

## Application-wide defaults

Use `provideNgTelInputAutocomplete()` during bootstrap to set product defaults once. Component inputs always override these defaults when provided locally.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNgTelInputAutocomplete } from 'ng-tel-input-autocomplete';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgTelInputAutocomplete({
      defaultCountry: 'IN',
      flagMode: 'emoji',
      validationEnabled: true,
      suggestionsEnabled: true,
      resetCountryOnClear: false,
      size: 'small',
    }),
  ],
};
```

Configurable defaults include `defaultCountry`, `allowedCountries`, `excludedCountries`, `outputFormat`, `autocomplete`, `inputMode`, `suggestionsEnabled`, `contactSearchEnabled`, `validationEnabled`, `minQueryLength`, `delay`, `completeOnFocus`, `showClear`, `resetCountryOnClear`, `fluid`, `variant`, `size`, `flagMode`, and `flagUrl`.

## Reactive Forms

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTelInputAutocomplete, PhoneInputValue } from 'ng-tel-input-autocomplete';

@Component({
  selector: 'app-contact-form',

  imports: [ReactiveFormsModule, NgTelInputAutocomplete],
  template: `
    <label for="work-phone">Work phone</label>
    <ng-tel-input-autocomplete
      inputId="work-phone"
      [formControl]="phone"
      defaultCountry="IN"
      [suggestionsEnabled]="false"
    />
  `,
})
export class ContactForm {
  readonly phone = new FormControl<PhoneInputValue>(null, {
    validators: [Validators.required],
  });
}
```

## Signal Forms

Angular 21 Signal Forms can consume the component through the same form-control contract used by reactive forms. Keep the field type compatible with the selected output format.

```ts
import { form, schema, required } from '@angular/forms/signals';
import { signal } from '@angular/core';
import { PhoneInputValue } from 'ng-tel-input-autocomplete';

readonly model = signal<{ phone: PhoneInputValue }>({ phone: null });
readonly contactForm = form(this.model, schema((field) => {
  required(field.phone);
}));
```

```html
<ng-tel-input-autocomplete
  inputId="signal-phone"
  [formField]="contactForm.phone"
  defaultCountry="US"
/>
```

## Template-driven Forms

```html
<ng-tel-input-autocomplete
  inputId="mobile-phone"
  ariaLabel="Mobile phone"
  [(ngModel)]="phone"
  name="phone"
/>
```

Import `FormsModule` in the consuming component.

## Country filtering and layout direction

Use ISO 3166-1 alpha-2 country codes for country filtering:

```html
<ng-tel-input-autocomplete
  defaultCountry="IN"
  [allowedCountries]="['IN', 'US', 'GB']"
  [excludedCountries]="['GB']"
/>
```

Set `dir="rtl"` or `dir="auto"` when the field appears in right-to-left or mixed-language layouts.

## Contact autocomplete

The library emits the current query; your application owns the contact source and passes matching suggestions back.

```html
<ng-tel-input-autocomplete
  [formControl]="phone"
  [suggestions]="suggestions"
  [suggestionsLoading]="loading"
  [suggestionsExhausted]="suggestionsExhausted"
  (suggestionSearch)="searchContacts($event)"
  (loadMoreSuggestions)="loadNextPage()"
/>
```

```ts
import { PhoneSuggestion } from 'ng-tel-input-autocomplete';

suggestions: PhoneSuggestion[] = [
  { name: 'Asha Rao', phoneNumber: '+919876543210', countryCode: 'IN' },
];
```

Alphabetic search text is emitted through `suggestionSearch` but is not written to the form control. Selecting a suggestion writes its phone value.

## Clear behavior

The clear button resets the phone value and emits `null`. By default it preserves the selected country so users can retype another number for the same region. Set `[resetCountryOnClear]="true"` or configure `resetCountryOnClear: true` globally to restore the configured `defaultCountry` when clearing.

## Values and validation

The default `outputFormat="string"` emits a valid E.164 value such as `+919876543210`. While an incomplete number is being edited, the current display value is emitted. Set `outputFormat="object"` for:

```ts
interface PhoneNumberValue {
  number: string;
  internationalNumber: string;
  nationalNumber: string;
  e164Number: string;
  countryCode: string;
  dialCode: string;
}
```

Invalid non-empty values produce `{ invalidPhoneNumber: true }`. Set `[validationEnabled]="false"` to disable the library validator.

For typed forms, use `FormControl<PhoneInputValue>` when the control may emit strings, objects, or `null`. If your app fixes `outputFormat="string"`, `FormControl<string | null>` is also appropriate; with `outputFormat="object"`, use `FormControl<PhoneNumberValue | null>`.

The `required` input only forwards the native `required` attribute. Use Angular `Validators.required` in reactive forms or the Angular `required` validator in template-driven forms when the form control itself must be invalid while empty.

## Inputs, outputs, and types

Every component input, output event, interface, template context, and service method is documented in the [API reference](api-reference.md).

## Styling

Use the class/style inputs to customize the built-in UI while keeping the component behavior and accessibility intact.

```html
<ng-tel-input-autocomplete
  containerClass="rounded-phone"
  [containerStyle]="{ borderColor: '#18181b' }"
  inputClass="phone-text"
  [dropdownStyle]="{ maxHeight: '18rem' }"
/>
```

## Theme tokens

The component exposes CSS custom properties on the host. Override them globally through `ng-tel-input-autocomplete { ... }`, or locally through wrapper selectors. See the [API reference](api-reference.md#theme-tokens) for the full token list.

```css
ng-tel-input-autocomplete.enterprise-phone {
  --ngti-color-primary: #0f766e;
  --ngti-color-primary-strong: #115e59;
  --ngti-size-input-height: 2.5rem;
  --ngti-radius-sm: 0.25rem;
}
```

## Country API

Call `provideHttpClient()` in the application when `countrySearchUrl` is used:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch())],
};
```

The endpoint receives `q`, `page`, and `limit` query parameters and must return:

```json
{
  "data": [
    {
      "name": "India",
      "code": "IN",
      "dialCode": "+91",
      "flag": "🇮🇳",
      "format": "",
      "placeholder": "98765 43210"
    }
  ],
  "meta": { "page": 1, "limit": 15, "total": 1, "hasMore": false }
}
```

During server rendering, the local country dataset is used to keep rendering deterministic.

## Image flags

Emoji flags avoid network requests and work with strict Content Security Policies. To use images:

```html
<ng-tel-input-autocomplete flagMode="image" [flagUrl]="flagUrl" />
```

```ts
readonly flagUrl = (code: string) => `/assets/flags/${code.toLowerCase()}.svg`;
```

If image mode is selected without a resolver, the component falls back to `https://flagcdn.com/{code}.svg`.

## Accessibility checklist

* Use a visible `<label for="...">` with `inputId`, or provide `ariaLabel` / `ariaLabelledBy`.
* The input exposes combobox semantics with `aria-expanded`, `aria-controls`, `aria-activedescendant`, and `aria-invalid`.
* Country and suggestion overlays render as listboxes with option rows.
* `Escape`, `Tab`, `ArrowUp`, `ArrowDown`, and `Enter` are supported for keyboard users.
* Invalid state is exposed through `aria-invalid` and a screen-reader-only error message.
* Custom templates should not include nested buttons, links, or form controls inside option rows.

## Development and publishing

```bash
npm run test:lib
npm run build:lib
npm run verify:lib
```

The package includes `README.md`, `API.md`, `LICENSE`, and `CHANGELOG.md` in the built npm artifact. `verify:lib` tests the library, builds the production package and demo against `dist`, and performs an npm package dry run. Publishing should be performed from `dist/ng-tel-input-autocomplete` through the release workflow.

## Links

* Repository: [Subhrangsu90/tel-input-autocomplete](https://github.com/Subhrangsu90/tel-input-autocomplete)
* Library source: [projects/ng-tel-input-autocomplete](../../projects/ng-tel-input-autocomplete/)
* npm package: [ng-tel-input-autocomplete](https://www.npmjs.com/package/ng-tel-input-autocomplete)

## License

MIT
