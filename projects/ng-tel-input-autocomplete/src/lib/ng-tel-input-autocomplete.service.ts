import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import * as lpn from 'google-libphonenumber';
import intlTelInput from 'intl-tel-input';
import { Country, PhoneNumberValue } from './ng-tel-input-autocomplete.types';
import { COUNTRIES } from './countries-data';

@Injectable({
  providedIn: 'root'
})
export class NgTelInputAutocompleteService {
  private http = inject(HttpClient, { optional: true });
  private readonly phoneUtil = lpn.PhoneNumberUtil.getInstance();

  private getFlagEmoji(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }

  /**
   * Expose local fallback list of countries enriched from intl-tel-input
   */
  getStaticCountries(): Country[] {
    try {
      const rawList = intlTelInput.getAllCountries();
      if (!rawList || rawList.length === 0) {
        return COUNTRIES;
      }
      return rawList.map(c => {
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
          flag: this.getFlagEmoji(c.iso2),
          format: '', // Managed live by AsYouTypeFormatter
          placeholder: placeholder
        };
      });
    } catch {
      return COUNTRIES;
    }
  }

  searchCountries(query: string, page = 1, limit = 10, apiUrl: string | null = null): Observable<{ data: Country[], meta: { page: number; limit: number; total: number; hasMore: boolean } }> {
    const staticCountries = this.getStaticCountries();

    // Fallback if API URL is not provided, or HTTP Client / Express API is not available
    if (!apiUrl || !this.http || typeof window === 'undefined') {
      const filtered = staticCountries.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.dialCode.includes(query) || 
        c.code.toLowerCase().includes(query.toLowerCase())
      );
      const offset = (page - 1) * limit;
      return of({
        data: filtered.slice(offset, offset + limit),
        meta: {
          page,
          limit,
          total: filtered.length,
          hasMore: offset + limit < filtered.length
        }
      });
    }

    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ data: Country[], meta: { page: number; limit: number; total: number; hasMore: boolean } }>(apiUrl, { params }).pipe(
      map(response => {
        if (!response || !response.data) {
          return { data: [], meta: { page, limit, total: 0, hasMore: false } };
        }
        return response;
      })
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
      const formattedInternational = this.phoneUtil.format(parsed, lpn.PhoneNumberFormat.INTERNATIONAL);
      
      return {
        countryCode: country.code,
        dialCode: country.dialCode,
        number: parsed.getNationalNumber()?.toString() || rawDigits,
        formattedNumber: formattedNational,
        fullNumber: formattedInternational
      };
    } catch {
      return {
        countryCode: country.code,
        dialCode: country.dialCode,
        number: rawDigits,
        formattedNumber: formatted,
        fullNumber: `${country.dialCode} ${formatted}`.trim()
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
        const found = this.getStaticCountries().find(c => c.code.toUpperCase() === countryCode.toUpperCase());
        if (found) return found;
      }
    } catch {
      // ignore
    }

    const countries = this.getStaticCountries().sort((a, b) => b.dialCode.length - a.dialCode.length);
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
        const staticC = this.getStaticCountries().find(c => c.code.toUpperCase() === countryCode.toUpperCase());
        if (staticC) {
          checkInput = `${staticC.dialCode}${phoneNumber.replace(/\D/g, '')}`;
        }
      }
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(checkInput, countryCode.toUpperCase());
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
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode.toUpperCase());
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
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode.toUpperCase());
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
      const parsedNumber = this.phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode.toUpperCase());
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
    if (!query) return this.escapeHtml(text);

    const escapedText = this.escapeHtml(text);
    const sanitizedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (!sanitizedQuery) return escapedText;

    const regex = new RegExp(`(${sanitizedQuery})`, 'gi');
    return escapedText.replace(regex, '<strong class="text-blue-600 font-bold bg-blue-100/80 px-0.5 rounded">$1</strong>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
