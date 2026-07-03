import { Injectable, inject } from '@angular/core';
// HttpClient and HttpParams are only used when countrySearchUrl is configured.
// Tree-shaking removes them for consumers who never use the server-side country API.
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, throwError } from 'rxjs';
import * as lpn from 'google-libphonenumber';
import intlTelInput from 'intl-tel-input';
import {
  CountrySearchResponse,
  Country,
  PhoneNumberValue,
} from '../models/ng-tel-input-autocomplete.types';
import { COUNTRIES } from '../data/countries-data';
import { escapeHtml, getFlagEmoji } from '../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class NgTelInputAutocompleteService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly phoneUtil = lpn.PhoneNumberUtil.getInstance();
  private cachedCountries: Country[] | null = null;



  /**
   * Expose local fallback list of countries enriched from intl-tel-input
   */
  getStaticCountries(): Country[] {
    if (this.cachedCountries) {
      return this.cachedCountries;
    }

    try {
      const rawList = intlTelInput.getAllCountries();
      if (!rawList || rawList.length === 0) {
        this.cachedCountries = COUNTRIES;
        return this.cachedCountries;
      }

      this.cachedCountries = rawList.map((c) => {
        const codeUpper = c.iso2.toUpperCase();
        let name = c.name;
        if (!name) {
          try {
            const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            name = regionNames.of(codeUpper) || '';
          } catch {
            name = '';
          }
        }
        if (!name) {
          name = codeUpper;
        }

        let placeholder = '';
        try {
          const example = this.phoneUtil.getExampleNumber(codeUpper);
          if (example) {
            placeholder = this.phoneUtil.format(example, lpn.PhoneNumberFormat.NATIONAL);
          }
        } catch {
          // ignore
        }
        if (!placeholder) {
          placeholder = `Enter number for ${name}`;
        }
        return {
          name: name,
          code: codeUpper,
          dialCode: `+${c.dialCode}`,
          flag: getFlagEmoji(c.iso2),
          format: '', // Managed live by AsYouTypeFormatter
          placeholder: placeholder,
        };
      });
      return this.cachedCountries;
    } catch {
      this.cachedCountries = COUNTRIES;
      return this.cachedCountries;
    }
  }

  searchCountries(
    query: string,
    page = 1,
    limit = 10,
    apiUrl: string | null = null,
  ): Observable<CountrySearchResponse> {
    const staticCountries = this.getStaticCountries();

    if (!apiUrl || typeof window === 'undefined') {
      const filtered = staticCountries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.dialCode.includes(query) ||
          c.code.toLowerCase().includes(query.toLowerCase()),
      );
      const offset = (page - 1) * limit;
      return of({
        data: filtered.slice(offset, offset + limit),
        meta: {
          page,
          limit,
          total: filtered.length,
          hasMore: offset + limit < filtered.length,
        },
      });
    }

    if (!this.http) {
      return throwError(
        () =>
          new Error(
            'NgTelInputAutocomplete requires provideHttpClient() when countrySearchUrl is configured.',
          ),
      );
    }

    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CountrySearchResponse>(apiUrl, { params }).pipe(
      map((response) => {
        if (!response || !response.data) {
          return { data: [], meta: { page, limit, total: 0, hasMore: false } };
        }
        return response;
      }),
    );
  }

  /**
   * Formats a raw phone number against a country's formatting pattern
   */
  formatPhoneNumber(rawNumber: string, countryCode: string): string {
    if (!rawNumber) return '';
    try {
      const formatter = new lpn.AsYouTypeFormatter(countryCode.toUpperCase());
      formatter.clear();
      let result = '';
      const digits = rawNumber.replace(/\D/g, '');
      for (const digit of digits) {
        result = formatter.inputDigit(digit);
      }
      return result;
    } catch {
      return rawNumber;
    }
  }

  /**
   * Parses and constructs a PhoneNumberValue from raw input and country selection
   */
  parsePhoneNumber(input: string, country: Country): PhoneNumberValue {
    const rawDigits = input.replace(/\D/g, '');
    const formatted = this.formatPhoneNumber(rawDigits, country.code);

    try {
      let parseInput = input;
      if (!input.startsWith('+') && !input.startsWith(country.dialCode)) {
        parseInput = `${country.dialCode}${rawDigits}`;
      }
      const parsed = this.phoneUtil.parseAndKeepRawInput(parseInput, country.code.toUpperCase());
      const formattedNational = this.phoneUtil.format(parsed, lpn.PhoneNumberFormat.NATIONAL);
      const formattedInternational = this.phoneUtil.format(
        parsed,
        lpn.PhoneNumberFormat.INTERNATIONAL,
      );
      const formattedE164 = this.phoneUtil.format(parsed, lpn.PhoneNumberFormat.E164);

      return {
        number: parsed.getNationalNumber()?.toString() || rawDigits,
        internationalNumber: formattedInternational,
        nationalNumber: formattedNational,
        e164Number: formattedE164,
        countryCode: country.code,
        dialCode: country.dialCode,
      };
    } catch {
      return {
        number: rawDigits,
        internationalNumber: `${country.dialCode} ${formatted}`.trim(),
        nationalNumber: formatted,
        e164Number: `${country.dialCode}${rawDigits}`,
        countryCode: country.code,
        dialCode: country.dialCode,
      };
    }
  }

  /**
   * Try to auto-detect country based on dial code typed in raw format
   */
  detectCountryByDialCode(input: string): Country | null {
    const cleaned = input.trim().replace('+', '');
    if (!cleaned) return null;

    try {
      const parsed = this.phoneUtil.parse('+' + cleaned);
      const countryCode = this.phoneUtil.getRegionCodeForNumber(parsed);
      if (countryCode) {
        const found = this.getStaticCountries().find(
          (c) => c.code.toUpperCase() === countryCode.toUpperCase(),
        );
        if (found) return found;
      }
    } catch {
      // ignore
    }

    const countries = [...this.getStaticCountries()].sort(
      (a, b) => b.dialCode.length - a.dialCode.length,
    );
    for (const country of countries) {
      const targetDial = country.dialCode.replace('+', '');
      if (cleaned.startsWith(targetDial)) {
        return country;
      }
    }

    return null;
  }

  /**
   * Validates if a phone number is valid for a given country code.
   */
  isValidNumber(phoneNumber: string, countryCode: string): boolean {
    try {
      if (!phoneNumber || !countryCode) return false;
      let checkInput = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        const staticC = this.getStaticCountries().find(
          (c) => c.code.toUpperCase() === countryCode.toUpperCase(),
        );
        if (staticC) {
          checkInput = `${staticC.dialCode}${phoneNumber.replace(/\D/g, '')}`;
        }
      }
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(
        checkInput,
        countryCode.toUpperCase(),
      );
      return this.phoneUtil.isValidNumber(parsedNumber);
    } catch {
      return false;
    }
  }

  /**
   * Formats a phone number in E164 format.
   */
  formatE164(phoneNumber: string, countryCode: string): string {
    try {
      if (!phoneNumber || !countryCode) return phoneNumber;
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(
        phoneNumber,
        countryCode.toUpperCase(),
      );
      return this.phoneUtil.format(parsedNumber, lpn.PhoneNumberFormat.E164);
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Formats a phone number in National format.
   */
  formatNational(phoneNumber: string, countryCode: string): string {
    try {
      if (!phoneNumber || !countryCode) return phoneNumber;
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(
        phoneNumber,
        countryCode.toUpperCase(),
      );
      return this.phoneUtil.format(parsedNumber, lpn.PhoneNumberFormat.NATIONAL);
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Formats a phone number in International format.
   */
  formatInternational(phoneNumber: string, countryCode: string): string {
    try {
      if (!phoneNumber || !countryCode) return phoneNumber;
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(
        phoneNumber,
        countryCode.toUpperCase(),
      );
      return this.phoneUtil.format(parsedNumber, lpn.PhoneNumberFormat.INTERNATIONAL);
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Highlights digits/characters matching the query in the phone number/text.
   * Prevents XSS by escaping HTML entities first.
   */
  highlightMatch(text: string, query: string): string {
    if (!text) return '';
    if (!query) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const sanitizedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (!sanitizedQuery) return escapedText;

    const regex = new RegExp(`(${sanitizedQuery})`, 'gi');
    return escapedText.replace(
      regex,
      '<mark style="background:var(--ngti-color-highlight-bg,#dbeafe);color:var(--ngti-color-highlight-text,#172554);font-weight:700;border-radius:.2rem;padding:0 .05rem">$1</mark>',
    );
  }
}
