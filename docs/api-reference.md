# API reference

## Public exports

The package root exports:

| Export | Kind | Notes |
| ------ | ---- | ----- |
| `NgTelInputAutocomplete` | Standalone component | Import directly in standalone components or NgModule declarations. |
| `NgTelInputAutocompleteService` | Injectable service | Shared country, parsing, formatting, validation, and highlighting helpers. |
| `provideNgTelInputAutocomplete` | Provider factory | Sets app-wide defaults. |
| `NG_TEL_INPUT_AUTOCOMPLETE_CONFIG` | Injection token | Advanced configuration access for tests and integrations. |
| `NG_TEL_INPUT_AUTOCOMPLETE_DEFAULT_CONFIG` | Constant | Default configuration object. |
| Types and interfaces | TypeScript exports | `Country`, `PhoneNumberValue`, `PhoneSuggestion`, event payloads, template contexts, config types, and helper aliases. |

## Provider API

Use `provideNgTelInputAutocomplete()` to define application-wide defaults. Inputs on an individual component instance take precedence.

```ts
import { provideNgTelInputAutocomplete } from 'ng-tel-input-autocomplete';

bootstrapApplication(App, {
  providers: [
    provideNgTelInputAutocomplete({
      defaultCountry: 'IN',
      flagMode: 'emoji',
      validationEnabled: true,
      resetCountryOnClear: false,
    }),
  ],
});
```

```ts
interface NgTelInputAutocompleteConfig {
  defaultCountry: string;
  allowedCountries: readonly string[];
  excludedCountries: readonly string[];
  outputFormat: 'string' | 'object';
  autocomplete: string;
  inputMode: string;
  suggestionsEnabled: boolean;
  contactSearchEnabled: boolean;
  validationEnabled: boolean;
  minQueryLength: number | null;
  delay: number | null;
  completeOnFocus: boolean;
  showClear: boolean;
  resetCountryOnClear: boolean;
  fluid: boolean;
  variant: 'filled' | 'outlined';
  size: 'small' | 'large' | null;
  flagMode: 'emoji' | 'image';
  flagUrl: FlagUrlResolver | null;
}
```

`NG_TEL_INPUT_AUTOCOMPLETE_CONFIG` and `NG_TEL_INPUT_AUTOCOMPLETE_DEFAULT_CONFIG` are exported for advanced integrations and tests.

## NgTelInputAutocomplete

Standalone Angular component exported as `NgTelInputAutocomplete` and rendered with the `ng-tel-input-autocomplete` selector.

```ts
import { NgTelInputAutocomplete } from 'ng-tel-input-autocomplete';
```

### Properties

All component properties are signal-based Angular inputs.

| Name                      | Type                                             | Default                        | Description                                                                                                                                       |
| ------------------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inputId`                 | `string`                                         | generated                      | ID assigned to the native telephone input. Set this when connecting a `<label for>` element.                                                      |
| `ariaLabel`               | `string`                                         | `'International phone number'` | Accessible name assigned to the telephone input.                                                                                                  |
| `defaultCountry`          | `string`                                         | `'US'`                         | Default ISO 3166-1 alpha-2 country code.                                                                                                          |
| `allowedCountries`        | `readonly string[]`                              | `[]`                           | Restricts the picker to these ISO alpha-2 codes.                                                                                                  |
| `excludedCountries`       | `readonly string[]`                              | `[]`                           | Removes these ISO alpha-2 codes from the picker. Applied after `allowedCountries`.                                                                |
| `outputFormat`            | `'string' \| 'object'`                           | `'string'`                     | Selects the form value and `valueChange` payload format.                                                                                          |
| `name`                    | `string \| null`                                 | `null`                         | Name forwarded to the native telephone input. Useful for browser autofill and non-Angular form serialization.                                     |
| `autocomplete`            | `string`                                         | `'tel'`                        | Native autocomplete hint forwarded to the telephone input.                                                                                        |
| `inputMode`               | `string`                                         | `'tel'`                        | Native input mode hint for mobile keyboards.                                                                                                      |
| `dir`                     | `'ltr' \| 'rtl' \| 'auto' \| null`               | `null`                         | Host direction and dropdown direction. Use for RTL or mixed-language layouts.                                                                     |
| `enterKeyHint`            | `string \| null`                                 | `null`                         | Native enter key hint such as `done`, `next`, or `search`.                                                                                        |
| `pattern`                 | `string \| null`                                 | `null`                         | Native pattern attribute forwarded to the telephone input.                                                                                        |
| `minLength`               | `number \| null`                                 | `null`                         | Native minimum text length attribute.                                                                                                             |
| `maxLength`               | `number \| null`                                 | `null`                         | Native maximum text length attribute.                                                                                                             |
| `min`                     | `number \| null`                                 | `null`                         | Native minimum value attribute forwarded to the input.                                                                                            |
| `max`                     | `number \| null`                                 | `null`                         | Native maximum value attribute forwarded to the input.                                                                                            |
| `step`                    | `number \| 'any' \| null`                        | `null`                         | Native step attribute forwarded to the input.                                                                                                     |
| `inputSize`               | `number \| null`                                 | `null`                         | Native size attribute controlling the visible input width in characters.                                                                          |
| `readOnly`                | `boolean`                                        | `false`                        | Makes the input readonly and prevents country, suggestion, and clear interactions. Programmatic form writes still work.                           |
| `readonly`                | `boolean`                                        | `false`                        | Alias for `readOnly`, useful when matching native input or PrimeNG-style naming.                                                                  |
| `required`                | `boolean`                                        | `false`                        | Native required attribute forwarded to the telephone input. Use Angular `Validators.required` / `required` validator for form-control validation. |
| `spellcheck`              | `boolean`                                        | `false`                        | Native spellcheck attribute forwarded to the telephone input.                                                                                     |
| `disabled`                | `boolean`                                        | `false`                        | Disables the input and country trigger outside Angular forms. CVA disabled state is also respected.                                               |
| `invalid`                 | `boolean`                                        | `false`                        | Forces invalid visual and ARIA state from external validation.                                                                                    |
| `ariaDescribedBy`         | `string \| null`                                 | `null`                         | Additional described-by IDs merged with the built-in error message ID.                                                                            |
| `ariaLabelledBy`          | `string \| null`                                 | `null`                         | External label IDs for `aria-labelledby`. When set, `ariaLabel` is not rendered.                                                                  |
| `placeholder`             | `string \| null`                                 | `null`                         | Custom placeholder for the native telephone input. When omitted, the selected country's example number is shown.                                  |
| `countrySearchUrl`        | `string \| null`                                 | `null`                         | Optional endpoint used for paginated country search in the browser.                                                                               |
| `suggestionsEnabled`      | `boolean`                                        | `true`                         | Enables the external contact-suggestion overlay and query events.                                                                                 |
| `contactSearchEnabled`    | `boolean`                                        | `true`                         | Allows names to be entered as temporary contact-search queries. Alphabetic queries are not written to the form value.                             |
| `validationEnabled`       | `boolean`                                        | `true`                         | Enables libphonenumber validation and the `invalidPhoneNumber` error.                                                                             |
| `minQueryLength`          | `number \| null`                                 | `null`                         | Minimum trimmed query length before contact suggestion search events are emitted.                                                                 |
| `delay`                   | `number \| null`                                 | `null`                         | Country search debounce in milliseconds. Uses `250` when omitted.                                                                                 |
| `completeOnFocus`         | `boolean`                                        | `true`                         | Emits suggestion search when the input receives focus. Disable to wait for typing.                                                                |
| `showClear`               | `boolean`                                        | `true`                         | Shows the clear button when the input has a value.                                                                                                |
| `resetCountryOnClear`     | `boolean`                                        | `false`                        | Resets the selected country to `defaultCountry` when the clear button is used.                                                                    |
| `fluid`                   | `boolean`                                        | `false`                        | Adds a fluid styling hook for full-width layouts. The host already renders as a block.                                                            |
| `variant`                 | `'filled' \| 'outlined'`                         | `'outlined'`                   | Selects outlined or filled input shell styling.                                                                                                   |
| `size`                    | `'small' \| 'large' \| null`                     | `null`                         | Adjusts input and trigger padding for compact or large displays.                                                                                  |
| `suggestions`             | `readonly PhoneSuggestion[]`                     | `[]`                           | Contact suggestions supplied by the consuming application.                                                                                        |
| `suggestionsLoading`      | `boolean`                                        | `false`                        | Displays the suggestion loading state and prevents duplicate `loadMoreSuggestions` emissions.                                                     |
| `suggestionsExhausted`    | `boolean`                                        | `false`                        | Indicates that no more contact suggestion pages are available.                                                                                    |
| `flagMode`                | `'emoji' \| 'image'`                             | `'emoji'`                      | Uses offline emoji flags or image flags.                                                                                                          |
| `flagUrl`                 | `FlagUrlResolver \| null`                        | `null`                         | Resolves image URLs when `flagMode="image"`. Defaults to FlagCDN when omitted.                                                                    |
| `selectedCountryTemplate` | `TemplateRef<CountryTemplateContext> \| null`    | `null`                         | Customizes the selected country inside the trigger.                                                                                               |
| `countryTemplate`         | `TemplateRef<CountryTemplateContext> \| null`    | `null`                         | Customizes every country option.                                                                                                                  |
| `suggestionTemplate`      | `TemplateRef<SuggestionTemplateContext> \| null` | `null`                         | Customizes every contact suggestion option.                                                                                                       |
| `emptyTemplate`           | `TemplateRef<StateTemplateContext> \| null`      | `null`                         | Customizes empty country and suggestion states.                                                                                                   |
| `loadingTemplate`         | `TemplateRef<StateTemplateContext> \| null`      | `null`                         | Customizes country and suggestion loading states.                                                                                                 |
| `containerClass`          | `NgTelInputClassValue \| null`                   | `null`                         | Adds classes to the outer input shell.                                                                                                            |
| `containerStyle`          | `NgTelInputStyleValue \| null`                   | `null`                         | Adds inline styles to the outer input shell.                                                                                                      |
| `countryButtonClass`      | `NgTelInputClassValue \| null`                   | `null`                         | Adds classes to the country trigger button.                                                                                                       |
| `countryButtonStyle`      | `NgTelInputStyleValue \| null`                   | `null`                         | Adds inline styles to the country trigger button.                                                                                                 |
| `inputClass`              | `NgTelInputClassValue \| null`                   | `null`                         | Adds classes to the native telephone input.                                                                                                       |
| `inputStyle`              | `NgTelInputStyleValue \| null`                   | `null`                         | Adds inline styles to the native telephone input.                                                                                                 |
| `actionsClass`            | `NgTelInputClassValue \| null`                   | `null`                         | Adds classes to the clear action container.                                                                                                       |
| `actionsStyle`            | `NgTelInputStyleValue \| null`                   | `null`                         | Adds inline styles to the clear action container.                                                                                                 |
| `dropdownClass`           | `NgTelInputClassValue \| null`                   | `null`                         | Adds classes to country and suggestion dropdown panels.                                                                                           |
| `dropdownStyle`           | `NgTelInputStyleValue \| null`                   | `null`                         | Adds inline styles to country and suggestion dropdown panels.                                                                                     |

### Emitters

Angular output events do not bubble through the DOM.

| Name                  | Payload                          | Emitted when                                                                                                                   |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `suggestionSearch`    | `string`                         | The input receives focus or its contact-search query changes while suggestions are enabled.                                    |
| `completeMethod`      | `AutoCompleteCompleteEvent`      | PrimeNG-style typed search event. Emits with the current query when suggestions should be searched.                            |
| `loadMoreSuggestions` | `void`                           | The suggestion list reaches its scroll boundary while it is not loading and `suggestionsExhausted` is false.                   |
| `valueChange`         | `PhoneInputValue`                | User input, country selection, suggestion selection, or clearing changes the component value. `writeValue()` does not emit it. |
| `countryLoadError`    | `unknown`                        | Loading a configured country endpoint fails, including when `provideHttpClient()` is missing.                                  |
| `suggestionSelect`    | `AutoCompleteSelectEvent`        | A contact suggestion is selected by click or keyboard.                                                                         |
| `countrySelect`       | `CountrySelectEvent`             | A country is selected from the country list or detected-country prompt.                                                        |
| `inputFocus`          | `Event`                          | The native telephone input receives focus.                                                                                     |
| `inputBlur`           | `Event`                          | The native telephone input loses focus.                                                                                        |
| `dropdownClick`       | `AutoCompleteDropdownClickEvent` | The country dropdown trigger is clicked.                                                                                       |
| `clear`               | `void`                           | The clear button is clicked and the value is reset.                                                                            |
| `inputKeydown`        | `KeyboardEvent`                  | A keydown event occurs on the native telephone input.                                                                          |
| `inputKeyup`          | `KeyboardEvent`                  | A keyup event occurs on the native telephone input.                                                                            |
| `overlayShow`         | `AutoCompleteOverlayEvent`       | The country or suggestion overlay opens.                                                                                       |
| `overlayHide`         | `AutoCompleteOverlayEvent`       | The country or suggestion overlay closes.                                                                                      |
| `lazyLoad`            | `AutoCompleteLazyLoadEvent`      | Country pages or another suggestion page are requested from scroll.                                                            |

### Templates

Templates are passed as `TemplateRef` inputs. Custom option templates are rendered inside the library's accessible option button, so they should contain presentation content only—not nested buttons, links, or form controls.

```html
<ng-template #selectedCountry let-country>
  <span>{{ country.flag }} {{ country.dialCode }}</span>
</ng-template>

<ng-template #country let-country let-selected="selected">
  <span>{{ country.flag }} {{ country.name }} ({{ country.dialCode }})</span>
  @if (selected) { <span aria-hidden="true">✓</span> }
</ng-template>

<ng-template #suggestion let-item let-index="index" let-active="active">
  <span>{{ index + 1 }}. {{ item.name }} — {{ item.phoneNumber }}</span>
  @if (active) { <span class="sr-only">Active</span> }
</ng-template>

<ng-template #empty let-type>
  <span>No {{ type }} available</span>
</ng-template>

<ng-template #loading let-type>
  <span>Loading {{ type }}…</span>
</ng-template>

<ng-tel-input-autocomplete
  [selectedCountryTemplate]="selectedCountry"
  [countryTemplate]="country"
  [suggestionTemplate]="suggestion"
  [emptyTemplate]="empty"
  [loadingTemplate]="loading"
/>
```

| Template input            | Context variables                                      |
| ------------------------- | ------------------------------------------------------ |
| `selectedCountryTemplate` | `$implicit`, `country`, `selected`                     |
| `countryTemplate`         | `$implicit`, `country`, `selected`                     |
| `suggestionTemplate`      | `$implicit`, `suggestion`, `index`, `active`           |
| `emptyTemplate`           | `$implicit`, `type` (`'countries'` or `'suggestions'`) |
| `loadingTemplate`         | `$implicit`, `type` (`'countries'` or `'suggestions'`) |

### Styling hooks

Pass class or style inputs when an application needs to adjust the rendered parts without replacing templates.

```html
<ng-tel-input-autocomplete
  containerClass="rounded-phone"
  [containerStyle]="{ borderColor: '#18181b' }"
  inputClass="phone-text"
  [dropdownStyle]="{ maxHeight: '18rem' }"
/>
```

`NgTelInputClassValue` accepts the same shapes as `NgClass`: string, string array, `Set<string>`, or object map. `NgTelInputStyleValue` is an object map compatible with `NgStyle`.

### Theme tokens

The default theme is implemented with CSS custom properties on the component host. Override these tokens from application CSS for enterprise design-system alignment.

| Group         | Variables                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface       | `--ngti-color-surface`, `--ngti-color-surface-muted`, `--ngti-color-surface-hover`, `--ngti-color-surface-raised`                                                                                                                                                                                                                                                                               |
| Option states | `--ngti-color-option-active`, `--ngti-color-option-selected`, `--ngti-color-highlight-bg`, `--ngti-color-highlight-text`                                                                                                                                                                                                                                                                        |
| Text          | `--ngti-color-text`, `--ngti-color-text-muted`, `--ngti-color-text-soft`                                                                                                                                                                                                                                                                                                                        |
| Border        | `--ngti-color-border`, `--ngti-color-border-soft`, `--ngti-color-border-strong`                                                                                                                                                                                                                                                                                                                 |
| Brand         | `--ngti-color-primary`, `--ngti-color-primary-strong`, `--ngti-color-primary-soft`, `--ngti-color-primary-border`                                                                                                                                                                                                                                                                               |
| Validation    | `--ngti-color-success`, `--ngti-color-danger`, `--ngti-color-danger-border`, `--ngti-color-danger-soft`                                                                                                                                                                                                                                                                                         |
| Radius        | `--ngti-radius-xs`, `--ngti-radius-sm`, `--ngti-radius-md`, `--ngti-radius-lg`, `--ngti-radius-xl`, `--ngti-radius-pill`                                                                                                                                                                                                                                                                        |
| Sizing        | `--ngti-size-flag-width`, `--ngti-size-flag-height`, `--ngti-size-icon-button`, `--ngti-size-input-height`, `--ngti-size-input-height-sm`, `--ngti-size-input-height-lg`, `--ngti-size-option-min-height`, `--ngti-size-suggestion-avatar`, `--ngti-size-dropdown-max-height`, `--ngti-size-listbox-max-height`                                                                                 |
| Spacing       | `--ngti-space-control-block`, `--ngti-space-control-inline`, `--ngti-space-trigger-block`, `--ngti-space-trigger-inline`, `--ngti-space-option-block`, `--ngti-space-option-inline`, `--ngti-space-option-gap`, `--ngti-space-option-copy-gap`, `--ngti-space-search-block`, `--ngti-space-search-inline`, `--ngti-space-search-input`, `--ngti-space-badge-block`, `--ngti-space-badge-inline` |
| Effects       | `--ngti-font-mono`, `--ngti-shadow-sm`, `--ngti-shadow-focus`, `--ngti-shadow-danger`, `--ngti-shadow-dropdown`, `--ngti-transition-fast`, `--ngti-transition-base`                                                                                                                                                                                                                             |

### Forms and validation

The component implements `ControlValueAccessor` and `Validator`, so it works with Reactive Forms and template-driven forms. Use `FormControl<PhoneInputValue>` for the widest typed control, `FormControl<string | null>` when `outputFormat="string"`, or `FormControl<PhoneNumberValue | null>` when `outputFormat="object"`.

```ts
readonly phone = new FormControl<PhoneInputValue>(null, {
  validators: [Validators.required],
});
```

The `required` input only forwards the native `required` attribute to the rendered `<input>`. Angular form validity should be configured with `Validators.required` in reactive forms or the Angular `required` validator in template-driven forms.

| Configuration                           | Form value                          |
| --------------------------------------- | ----------------------------------- |
| `outputFormat="string"` and valid       | E.164 string such as `+12025550143` |
| `outputFormat="string"` and incomplete  | Current formatted display string    |
| `outputFormat="object"`                 | `PhoneNumberValue`                  |
| Empty value or alphabetic contact query | `null`                              |

A non-empty invalid phone value produces:

```ts
{
  invalidPhoneNumber: true;
}
```

## Country data and remote search

By default, countries are loaded from the bundled metadata and enriched with `intl-tel-input` and `google-libphonenumber` examples. `allowedCountries` and `excludedCountries` always use the local list.

When `countrySearchUrl` is set and no country filters are active, browser-side country searches call the configured endpoint with `q`, `page`, and `limit` query parameters. The endpoint must return `CountrySearchResponse`.

Applications must provide Angular HTTP when using a remote country endpoint:

```ts
import { provideHttpClient, withFetch } from '@angular/common/http';

bootstrapApplication(App, {
  providers: [provideHttpClient(withFetch())],
});
```

During server rendering, the component falls back to the local country list.

### Signal Forms

Angular 21 Signal Forms can bind to the component through the same control contract. Keep the field value type aligned with `outputFormat`.

```ts
readonly model = signal<{ phone: PhoneInputValue }>({ phone: null });
readonly contactForm = form(this.model, schema((field) => {
  required(field.phone);
}));
```

```html
<ng-tel-input-autocomplete [formField]="contactForm.phone" />
```

### Keyboard support

| Key         | Behavior                                                          |
| ----------- | ----------------------------------------------------------------- |
| `ArrowDown` | Opens suggestions when available or moves to the next option.     |
| `ArrowUp`   | Opens suggestions when available or moves to the previous option. |
| `Enter`     | Selects the active option.                                        |
| `Escape`    | Closes the active overlay.                                        |
| `Tab`       | Closes the overlay and continues normal focus navigation.         |

### Accessibility

The phone input uses the `combobox` role with `aria-autocomplete`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and `aria-invalid`. Country and suggestion overlays use `listbox`; each result uses `option`. Use a visible `<label>` connected through `inputId`, or provide a meaningful `ariaLabel`.

## Interfaces

### Country

| Field         | Type     | Description                                                                 |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `name`        | `string` | Display name.                                                               |
| `code`        | `string` | ISO 3166-1 alpha-2 code.                                                    |
| `dialCode`    | `string` | International dialing prefix including `+`.                                 |
| `flag`        | `string` | Emoji flag.                                                                 |
| `format`      | `string` | Optional formatting metadata. Live formatting is handled by libphonenumber. |
| `placeholder` | `string` | Example national number or fallback prompt.                                 |

### PhoneSuggestion

| Field         | Type     | Required | Description                                               |
| ------------- | -------- | -------- | --------------------------------------------------------- |
| `phoneNumber` | `string` | Yes      | Number written when the suggestion is selected.           |
| `name`        | `string` | No       | Contact display name.                                     |
| `subtitle`    | `string` | No       | Secondary descriptive text.                               |
| `countryCode` | `string` | No       | ISO alpha-2 code used for the flag and country selection. |
| `avatar`      | `string` | No       | Reserved avatar value for custom suggestion templates.    |

### PhoneNumberValue

| Field                 | Type     | Description                                        |
| --------------------- | -------- | -------------------------------------------------- |
| `number`              | `string` | National number digits without the dialing prefix. |
| `internationalNumber` | `string` | Internationally formatted number.                  |
| `nationalNumber`      | `string` | Nationally formatted number.                       |
| `e164Number`          | `string` | E.164 formatted phone number.                      |
| `countryCode`         | `string` | Selected ISO alpha-2 country code.                 |
| `dialCode`            | `string` | Selected international dialing prefix.             |

### CountrySearchResponse

```ts
interface CountrySearchResponse {
  data: Country[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Event payloads

```ts
interface AutoCompleteCompleteEvent {
  originalEvent?: Event;
  query: string;
}

interface AutoCompleteSelectEvent {
  originalEvent?: Event;
  suggestion: PhoneSuggestion;
  value: PhoneInputValue;
}

interface CountrySelectEvent {
  originalEvent?: Event;
  country: Country;
  value: PhoneInputValue;
}

interface AutoCompleteDropdownClickEvent {
  originalEvent: MouseEvent;
  open: boolean;
}

interface AutoCompleteOverlayEvent {
  type: 'countries' | 'suggestions';
}

interface AutoCompleteLazyLoadEvent {
  type: 'countries' | 'suggestions';
  query: string;
  page?: number;
  rows?: number;
  first?: number;
}
```

### Template contexts

```ts
interface CountryTemplateContext {
  $implicit: Country;
  country: Country;
  selected: boolean;
}

interface SuggestionTemplateContext {
  $implicit: PhoneSuggestion;
  suggestion: PhoneSuggestion;
  index: number;
  active: boolean;
}

interface StateTemplateContext {
  $implicit: 'countries' | 'suggestions';
  type: 'countries' | 'suggestions';
}
```

### Type aliases

```ts
type PhoneInputValue = PhoneNumberValue | string | null;
type FlagMode = 'emoji' | 'image';
type FlagUrlResolver = (countryCode: string) => string;
interface NgTelInputAutocompleteConfig {
  /* see Provider API */
}
type NgTelInputAutocompleteConfigInput = Partial<NgTelInputAutocompleteConfig>;
type NgTelInputClassValue =
  string | readonly string[] | Set<string> | Record<string, boolean | null | undefined>;
type NgTelInputStyleValue = Record<string, string | number | null | undefined>;
```

## NgTelInputAutocompleteService

The root-provided service is public for applications that need the same parsing and formatting behavior outside the component.

| Method                                           | Returns                             | Description                                                      |
| ------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------- |
| `getStaticCountries()`                           | `Country[]`                         | Returns country metadata used by the component.                  |
| `searchCountries(query, page?, limit?, apiUrl?)` | `Observable<CountrySearchResponse>` | Filters local countries or calls the configured endpoint.        |
| `formatPhoneNumber(rawNumber, countryCode)`      | `string`                            | Formats digits while typing.                                     |
| `parsePhoneNumber(input, country)`               | `PhoneNumberValue`                  | Creates the library's object value.                              |
| `detectCountryByDialCode(input)`                 | `Country \| null`                   | Detects a country from an international prefix.                  |
| `isValidNumber(phoneNumber, countryCode)`        | `boolean`                           | Validates a number.                                              |
| `formatE164(phoneNumber, countryCode)`           | `string`                            | Formats as E.164.                                                |
| `formatNational(phoneNumber, countryCode)`       | `string`                            | Formats in national form.                                        |
| `formatInternational(phoneNumber, countryCode)`  | `string`                            | Formats in international display form.                           |
| `highlightMatch(text, query)`                    | `string`                            | Escapes text and wraps matching content for highlighted display. |
