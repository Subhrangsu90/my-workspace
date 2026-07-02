import { SomeOptions } from 'intl-tel-input';

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

export type NgTelInputOptions = SomeOptions;

