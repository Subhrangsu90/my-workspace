export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 code
  dialCode: string; // e.g. "+1"
  flag: string; // Emoji flag
  format: string; // Formatting string, e.g. "(###) ###-####" where # is a digit
  placeholder: string; // Example formatted phone number
}

export interface PhoneNumberValue {
  countryCode: string; // e.g. "US"
  dialCode: string; // e.g. "+1"
  number: string; // Raw digits (excluding dial code) e.g. "2015550123"
  formattedNumber: string; // Formatted number e.g. "(201) 555-0123"
  fullNumber: string; // e.g. "+1 201 555 0123" or "+1(201) 555-0123" (dialCode + space + formattedNumber)
}

export interface PhoneSuggestion {
  name?: string;
  phoneNumber: string;
  subtitle?: string;
  countryCode?: string; // Optional to detect flag of suggestion
  avatar?: string; // Optional initials/avatar representation
}

export interface CountrySearchResponse {
  data: Country[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CountryTemplateContext {
  $implicit: Country;
  country: Country;
  selected: boolean;
}

export interface SuggestionTemplateContext {
  $implicit: PhoneSuggestion;
  suggestion: PhoneSuggestion;
  index: number;
  active: boolean;
}

export interface StateTemplateContext {
  $implicit: 'countries' | 'suggestions';
  type: 'countries' | 'suggestions';
}

export interface AutoCompleteCompleteEvent {
  originalEvent?: Event;
  query: string;
}

export interface AutoCompleteSelectEvent {
  originalEvent?: Event;
  suggestion: PhoneSuggestion;
  value: PhoneInputValue;
}

export interface CountrySelectEvent {
  originalEvent?: Event;
  country: Country;
  value: PhoneInputValue;
}

export interface AutoCompleteDropdownClickEvent {
  originalEvent: MouseEvent;
  open: boolean;
}

export interface AutoCompleteOverlayEvent {
  type: 'countries' | 'suggestions';
}

export interface AutoCompleteLazyLoadEvent {
  type: 'countries' | 'suggestions';
  query: string;
  page?: number;
  rows?: number;
  first?: number;
}

export type PhoneInputValue = PhoneNumberValue | string | null;
export type FlagMode = 'emoji' | 'image';
export type FlagUrlResolver = (countryCode: string) => string;

export interface NgTelInputAutocompleteConfig {
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
  flagMode: FlagMode;
  flagUrl: FlagUrlResolver | null;
}

export type NgTelInputAutocompleteConfigInput = Partial<NgTelInputAutocompleteConfig>;
export type NgTelInputClassValue =
  string | readonly string[] | Set<string> | Record<string, boolean | null | undefined>;
export type NgTelInputStyleValue = Record<string, string | number | null | undefined>;
