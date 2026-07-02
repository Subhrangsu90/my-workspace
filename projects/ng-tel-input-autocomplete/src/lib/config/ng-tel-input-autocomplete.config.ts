import { InjectionToken, Provider } from '@angular/core';
import {
  NgTelInputAutocompleteConfig,
  NgTelInputAutocompleteConfigInput,
} from '../models/ng-tel-input-autocomplete.types';

export const NG_TEL_INPUT_AUTOCOMPLETE_DEFAULT_CONFIG: NgTelInputAutocompleteConfig = {
  defaultCountry: 'US',
  allowedCountries: [],
  excludedCountries: [],
  outputFormat: 'string',
  autocomplete: 'tel',
  inputMode: 'tel',
  suggestionsEnabled: true,
  contactSearchEnabled: true,
  validationEnabled: true,
  minQueryLength: null,
  delay: null,
  completeOnFocus: true,
  showClear: true,
  resetCountryOnClear: false,
  fluid: false,
  variant: 'outlined',
  size: null,
  flagMode: 'emoji',
  flagUrl: null,
};

export const NG_TEL_INPUT_AUTOCOMPLETE_CONFIG = new InjectionToken<NgTelInputAutocompleteConfig>(
  'ng-tel-input-autocomplete.config',
  {
    providedIn: 'root',
    factory: () => NG_TEL_INPUT_AUTOCOMPLETE_DEFAULT_CONFIG,
  },
);

export function provideNgTelInputAutocomplete(
  config: NgTelInputAutocompleteConfigInput = {},
): Provider[] {
  return [
    {
      provide: NG_TEL_INPUT_AUTOCOMPLETE_CONFIG,
      useValue: {
        ...NG_TEL_INPUT_AUTOCOMPLETE_DEFAULT_CONFIG,
        ...config,
      },
    },
  ];
}
