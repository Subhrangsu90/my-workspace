import {
  Component,
  OnInit,
  ElementRef,
  signal,
  effect,
  forwardRef,
  inject,
  HostListener,
  DestroyRef,
  output,
  input,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, of, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NgTelInputAutocompleteService } from './ng-tel-input-autocomplete.service';
import { NgTelInputDropdown } from './ng-tel-input-dropdown';
import { NgTelInputIcon } from './ng-tel-input-icons';
import { Country, PhoneNumberValue, PhoneSuggestion, NgTelInputOptions } from './ng-tel-input-autocomplete.types';

@Component({
  selector: 'lib-ng-tel-input-autocomplete',
  standalone: true,
  imports: [CommonModule, OverlayModule, NgTelInputDropdown, NgTelInputIcon],
  template: `
    <div 
      class="relative flex items-stretch border rounded-xl overflow-hidden transition-all duration-200 bg-white shadow-sm"
      [class.border-gray-200]="!disabled && !isFocused && !hasError"
      [class.border-blue-500]="isFocused && !hasError"
      [class.ring-2]="isFocused || hasError"
      [class.ring-blue-500/15]="isFocused && !hasError"
      [class.border-red-400]="hasError"
      [class.ring-red-500/15]="hasError"
      [class.bg-gray-50]="disabled"
      [class.border-gray-100]="disabled"
      id="phone-input-container"
      cdkOverlayOrigin
      #containerOrigin="cdkOverlayOrigin"
      #containerEl
    >
      <!-- Flag Selector Trigger -->
      <button
        #flagTrigger
        type="button"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        (click)="toggleOverlay()"
        [disabled]="disabled"
        class="flex items-center gap-2 px-3 bg-gray-50 border-r border-gray-200 hover:bg-gray-100/80 active:bg-gray-200/50 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:hover:bg-gray-50 transition-all duration-150 select-none outline-none focus:bg-gray-100 focus:ring-1 focus:ring-blue-500/30 shrink-0"
        id="country-selector-trigger"
      >
        @if (selectedCountry()) {
          <img
            [src]="'https://flagcdn.com/' + selectedCountry()?.code?.toLowerCase() + '.svg'"
            class="w-6 h-4 object-cover rounded-sm shadow-xs border border-gray-200/60 transition-transform duration-100 shrink-0"
            [alt]="selectedCountry()?.name"
            referrerpolicy="no-referrer"
          />
        } @else {
          <span class="text-lg leading-none flex items-center shrink-0">🌐</span>
        }
        <span class="font-mono text-sm font-semibold text-gray-600">
          {{ selectedCountry()?.dialCode || '' }}
        </span>
        <lib-tel-icon 
          name="chevron-down" 
          class="text-gray-400 transition-transform duration-200 shrink-0"
          [class.rotate-180]="isOpen()"
        ></lib-tel-icon>
      </button>

      <!-- Phone Number Input -->
      <input
        #phoneInput
        type="tel"
        [value]="inputValue"
        (input)="onInputChange($event)"
        (keydown)="handleInputKeyDown($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [disabled]="disabled"
        [placeholder]="placeholder() || selectedCountry()?.placeholder || 'Enter phone number'"
        class="flex-1 px-4 py-2.5 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base border-0 focus:ring-0 focus:outline-none w-full disabled:cursor-not-allowed disabled:text-gray-400"
        id="phone-number-text-input"
        autocomplete="tel"
      />

      <!-- Validation Status / Clear Icon -->
      <div class="flex items-center pr-3 gap-1.5 shrink-0">
        @if (inputValue && !disabled) {
          <button
            type="button"
            (click)="clearValue()"
            class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none flex items-center justify-center"
            title="Clear phone number"
            id="clear-phone-input"
          >
            <lib-tel-icon name="close" class="w-4 h-4"></lib-tel-icon>
          </button>
        }
        
        @if (enableValidation()) {
          @if (hasError) {
            <lib-tel-icon class="text-red-500 w-5 h-5 flex items-center justify-center" name="error" title="Invalid phone number"></lib-tel-icon>
          } @else if (inputValue && isValid()) {
            <lib-tel-icon class="text-emerald-500 w-5 h-5 flex items-center justify-center animate-fade-in" name="check" title="Valid phone number"></lib-tel-icon>
          }
        }
      </div>
    </div>

    <!-- Smart Country Suggestion Banner -->
    @if (suggestedCountry() && suggestedCountry()?.code !== selectedCountry()?.code) {
      <div class="mt-2 text-xs flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl px-3.5 py-2.5 animate-fade-in shadow-sm select-none">
        <div class="flex items-center gap-2 text-gray-600 font-medium">
          <img
            [src]="'https://flagcdn.com/' + suggestedCountry()?.code?.toLowerCase() + '.svg'"
            class="w-5.5 h-4 object-cover rounded shadow-xs border border-gray-200/60 shrink-0"
            [alt]="suggestedCountry()?.name"
            referrerpolicy="no-referrer"
          />
          <span>Detected: <strong class="text-gray-900 font-semibold">{{ suggestedCountry()?.name }}</strong> <span class="text-gray-400 font-mono">({{ suggestedCountry()?.dialCode }})</span></span>
        </div>
        <button 
          type="button" 
          (click)="selectSuggestedCountry()" 
          class="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 transition-colors duration-150 focus:outline-none focus:underline cursor-pointer border-0 bg-transparent"
          id="switch-suggested-country-btn"
        >
          <span>Switch country flag</span>
          <lib-tel-icon name="chevron-down" class="-rotate-90 w-3 h-3 font-bold"></lib-tel-icon>
        </button>
      </div>
    }

    <!-- Country Dropdown Overlay -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayWidth]="getOverlayWidth()"
      [cdkConnectedOverlayOffsetY]="4"
      (overlayOutsideClick)="closeOverlay()"
      (detach)="closeOverlay()"
    >
      <lib-ng-tel-input-dropdown
        type="countries"
        [items]="countries()"
        [selectedCountry]="selectedCountry()"
        [searchQuery]="searchQuery()"
        [loading]="loadingCountries()"
        [hasMore]="hasMoreCountries()"
        [activeIndex]="activeCountryIndex()"
        (activeIndexChange)="activeCountryIndex.set($event)"
        (itemSelected)="onCountrySelected($event)"
        (scrollEnd)="onScrollEndCountries()"
        (searchChanged)="onSearchChanged($event)"
        (closed)="closeOverlay()"
      />
    </ng-template>

    <!-- Suggestions Overlay -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="containerOrigin"
      [cdkConnectedOverlayOpen]="showSuggestions()"
      [cdkConnectedOverlayWidth]="getOverlayWidth()"
      [cdkConnectedOverlayOffsetY]="4"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="closeSuggestions()"
      (detach)="closeSuggestions()"
    >
      <lib-ng-tel-input-dropdown
        type="suggestions"
        [items]="suggestions()"
        [loading]="loading()"
        [hasMore]="!allLoaded()"
        [activeIndex]="activeSuggestionIndex()"
        (activeIndexChange)="activeSuggestionIndex.set($event)"
        [searchQuery]="inputValue"
        (itemSelected)="selectSuggestion($event)"
        (scrollEnd)="onLoadMoreSuggestions()"
        (closed)="closeSuggestions()"
      />
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgTelInputAutocomplete),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NgTelInputAutocomplete),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgTelInputAutocomplete implements OnInit, ControlValueAccessor, Validator {
  private readonly phoneService = inject(NgTelInputAutocompleteService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  defaultCountryCode = input<string>('US');
  onlyCountries = input<string[]>([]);
  excludeCountries = input<string[]>([]);
  valueFormat = input<'string' | 'object'>('string');
  placeholder = input<string>('Enter phone number...');
  options = input<NgTelInputOptions>({});
  countriesApiUrl = input<string | null>(null);
  enableSuggestions = input<boolean>(true);
  allowAlphanumeric = input<boolean>(true);
  enableValidation = input<boolean>(true);

  // Original library inputs/outputs for suggestion lists
  suggestions = input<PhoneSuggestion[]>([]);
  loading = input<boolean>(false);
  allLoaded = input<boolean>(false);

  queryChange = output<string>();
  loadMore = output<void>();
  valueChange = output<PhoneNumberValue | string | null>();

  // Element references
  phoneInput = viewChild<ElementRef<HTMLInputElement>>('phoneInput');
  containerEl = viewChild<ElementRef<HTMLDivElement>>('containerEl');

  // Reactive State (Signals)
  countries = signal<Country[]>([]);
  selectedCountry = signal<Country | null>(null);
  searchQuery = signal<string>('');
  loadingCountries = signal<boolean>(false);
  hasMoreCountries = signal<boolean>(false);
  isOpen = signal<boolean>(false);
  suggestedCountry = signal<Country | null>(null);

  // Phone suggestion overlays state
  showSuggestions = signal<boolean>(false);
  activeCountryIndex = signal<number>(0);
  activeSuggestionIndex = signal<number>(0);

  // Standard component state
  inputValue = '';
  isFocused = false;
  disabled = false;
  hasError = false;
  private justSelectedSuggestion = false;

  // Pagination for Country dropdown
  private currentCountryPage = 1;
  private readonly countriesPerPage = 15;

  // Debounce search stream for countries
  private searchSubject = new Subject<string>();

  // Form Control Value Accessor callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  private getFilteredStaticCountries(query: string): Country[] {
    let list = this.phoneService.getStaticCountries();

    const only = this.onlyCountries();
    if (only && only.length > 0) {
      const upperOnly = only.map(c => c.toUpperCase());
      list = list.filter(c => upperOnly.includes(c.code.toUpperCase()));
    }

    const exclude = this.excludeCountries();
    if (exclude && exclude.length > 0) {
      const upperExclude = exclude.map(c => c.toUpperCase());
      list = list.filter(c => !upperExclude.includes(c.code.toUpperCase()));
    }

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.dialCode.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q)
      );
    }

    return list;
  }

  private getCountries(query: string, page: number, limit = this.countriesPerPage): Observable<{ data: Country[], meta: { page: number; limit: number; total: number; hasMore: boolean } }> {
    const hasFilters = (this.onlyCountries() && this.onlyCountries().length > 0) || 
                       (this.excludeCountries() && this.excludeCountries().length > 0);
                        
    if (hasFilters || !this.countriesApiUrl()) {
      const filtered = this.getFilteredStaticCountries(query);
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

    return this.phoneService.searchCountries(query, page, limit, this.countriesApiUrl());
  }

  constructor() {
    effect(() => {
      const code = this.defaultCountryCode();
      const options = this.options();
      const initialCode = options?.initialCountry || code;

      const allowedStatic = this.getFilteredStaticCountries('');
      let defaultCountry = allowedStatic.find(
        c => c.code.toUpperCase() === (initialCode || '').toUpperCase()
      );

      if (!defaultCountry && allowedStatic.length > 0) {
        defaultCountry = allowedStatic[0];
      }

      if (defaultCountry && !this.inputValue) {
        this.selectedCountry.set(defaultCountry);
      }
    });
  }

  ngOnInit(): void {
    // Initial seed of country dropdown list
    this.loadCountriesPage(1);

    // Setup debounced search subscription for countries
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        this.currentCountryPage = 1;
        this.searchQuery.set(query);
        this.loadingCountries.set(true);
        this.activeCountryIndex.set(0);
        return this.getCountries(query, 1, this.countriesPerPage);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.countries.set(res.data);
        this.hasMoreCountries.set(res.meta.hasMore);
        this.loadingCountries.set(false);
      },
      error: () => {
        this.loadingCountries.set(false);
      }
    });
  }

  private loadCountriesPage(page: number, append = false): void {
    this.loadingCountries.set(true);
    this.getCountries(this.searchQuery(), page, this.countriesPerPage).subscribe({
      next: (res) => {
        if (append) {
          this.countries.update(current => [...current, ...res.data]);
        } else {
          this.countries.set(res.data);
        }
        this.hasMoreCountries.set(res.meta.hasMore);
        this.loadingCountries.set(false);
      },
      error: () => {
        this.loadingCountries.set(false);
      }
    });
  }

  toggleOverlay(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.closeOverlay();
    } else {
      this.isOpen.set(true);
      this.activeCountryIndex.set(0);
    }
  }

  closeOverlay(): void {
    this.isOpen.set(false);
    this.phoneInput()?.nativeElement.focus();
  }

  onCountrySelected(country: Country): void {
    this.selectedCountry.set(country);
    
    // Reformat existing digits to fit the new country's pattern
    const rawDigits = this.inputValue.replace(/\D/g, '');
    this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, country.code);
    
    this.propagateChanges();
    this.closeOverlay();
  }

  onSearchChanged(query: string): void {
    this.searchSubject.next(query);
  }

  onScrollEndCountries(): void {
    if (!this.loadingCountries() && this.hasMoreCountries()) {
      this.currentCountryPage++;
      this.loadCountriesPage(this.currentCountryPage, true);
    }
  }

  updateSuggestedCountry(value: string): void {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 1) {
      this.suggestedCountry.set(null);
      return;
    }

    const detected = this.phoneService.detectCountryByDialCode(cleaned);
    if (detected && detected.code !== this.selectedCountry()?.code) {
      this.suggestedCountry.set(detected);
    } else {
      this.suggestedCountry.set(null);
    }
  }

  selectSuggestedCountry(): void {
    const suggested = this.suggestedCountry();
    if (suggested) {
      this.selectedCountry.set(suggested);
      const rawDigits = this.inputValue.replace(/\D/g, '');
      const cleanDial = suggested.dialCode.replace('+', '');
      let remainingDigits = rawDigits;
      if (rawDigits.startsWith(cleanDial)) {
        remainingDigits = rawDigits.substring(cleanDial.length);
      }
      this.inputValue = this.phoneService.formatPhoneNumber(remainingDigits, suggested.code);
      this.suggestedCountry.set(null);
      this.propagateChanges();
      this.phoneInput()?.nativeElement.focus();
    }
  }

  updateSuggestionsState(value: string): void {
    if (!this.enableSuggestions()) {
      this.showSuggestions.set(false);
      return;
    }
    // Notify parent query has changed to trigger suggestion updates
    this.queryChange.emit(value);
    // Open overlay suggestions if we are focused and have suggestion list
    this.activeSuggestionIndex.set(0);
    this.showSuggestions.set(this.suggestions().length > 0 && this.isFocused);
  }

  selectSuggestion(suggestion: PhoneSuggestion): void {
    this.justSelectedSuggestion = true;
    let foundCountry: Country | undefined;
    
    if (suggestion.countryCode) {
      foundCountry = this.phoneService.getStaticCountries().find(
        c => c.code.toUpperCase() === suggestion.countryCode!.toUpperCase()
      );
    } else {
      // Guess country from the suggested phone digits
      const detected = this.phoneService.detectCountryByDialCode(suggestion.phoneNumber);
      if (detected) foundCountry = detected;
    }

    if (foundCountry) {
      this.selectedCountry.set(foundCountry);
      const cleanDial = foundCountry.dialCode.replace('+', '');
      const digits = suggestion.phoneNumber.replace(/\D/g, '');
      let localDigits = digits;
      if (digits.startsWith(cleanDial)) {
        localDigits = digits.substring(cleanDial.length);
      }
      this.inputValue = this.phoneService.formatPhoneNumber(localDigits, foundCountry.code);
      this.propagateChanges();
    } else {
      this.inputValue = suggestion.phoneNumber;
      this.propagateChanges();
    }
    this.closeSuggestions();
    this.phoneInput()?.nativeElement.focus();
  }

  closeSuggestions(): void {
    this.showSuggestions.set(false);
  }

  onLoadMoreSuggestions(): void {
    if (!this.loading() && !this.allLoaded()) {
      this.loadMore.emit();
    }
  }

  handleInputKeyDown(event: KeyboardEvent): void {
    if (!this.allowAlphanumeric()) {
      const allowedRegex = /^[0-9\-\+\(\)\s]$/;
      const isControlKey = event.key.length > 1;
      const isClipboardOrSelect = event.ctrlKey || event.metaKey;
      
      if (!isControlKey && !isClipboardOrSelect && !allowedRegex.test(event.key)) {
        event.preventDefault();
        return;
      }
    }

    if (!this.enableSuggestions()) return;
    if (!this.showSuggestions()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.showSuggestions.set(this.suggestions().length > 0);
        event.preventDefault();
      }
      return;
    }

    const list = this.suggestions();
    if (!list || list.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (this.activeSuggestionIndex() + 1) % list.length;
        this.activeSuggestionIndex.set(nextIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (this.activeSuggestionIndex() - 1 + list.length) % list.length;
        this.activeSuggestionIndex.set(prevIndex);
        break;
      case 'Enter':
        event.preventDefault();
        if (list[this.activeSuggestionIndex()]) {
          this.selectSuggestion(list[this.activeSuggestionIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeSuggestions();
        break;
      case 'Tab':
        this.closeSuggestions();
        break;
    }
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    if (value.startsWith('+') && !this.isOpen()) {
      this.isOpen.set(true);
      this.searchQuery.set(value);
      this.searchSubject.next(value);
    }

    if (value.startsWith('+') && value.length > 1) {
      const detected = this.phoneService.detectCountryByDialCode(value);
      if (detected) {
        this.selectedCountry.set(detected);
        const cleanInput = value.replace(detected.dialCode, '').replace('+', '');
        const rawDigits = cleanInput.replace(/\D/g, '');
        this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, detected.code);
        this.suggestedCountry.set(null);
        this.propagateChanges();
        this.updateSuggestionsState(this.inputValue);
        return;
      }
    }

    this.updateSuggestedCountry(value);

    if (this.allowAlphanumeric()) {
      // Allow letters, spaces, and numbers so users can type contact names or alphanumeric values.
      const hasLetters = /[a-zA-Z]/.test(value);
      if (hasLetters) {
        this.inputValue = value;
      } else {
        const rawDigits = value.replace(/\D/g, '');
        const activeCountry = this.selectedCountry();
        if (activeCountry) {
          this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, activeCountry.code);
        } else {
          this.inputValue = rawDigits;
        }
      }
    } else {
      // Reject letters and non-phone characters. Only allow digits and formatting symbols (+, -, (, ), spaces).
      const filteredValue = value.replace(/[^0-9\-\+\(\)\s]/g, '');
      const rawDigits = filteredValue.replace(/\D/g, '');
      const activeCountry = this.selectedCountry();
      if (activeCountry) {
        this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, activeCountry.code);
      } else {
        this.inputValue = rawDigits;
      }
    }

    this.propagateChanges();
    this.updateSuggestionsState(this.inputValue);
  }

  onFocus(): void {
    this.isFocused = true;
    if (this.justSelectedSuggestion) {
      this.justSelectedSuggestion = false;
      return;
    }
    this.updateSuggestionsState(this.inputValue);
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
    this.validateSelf();
    
    setTimeout(() => {
      if (!this.isFocused) {
        this.closeSuggestions();
      }
    }, 200);
  }

  clearValue(): void {
    this.inputValue = '';
    this.propagateChanges();
    this.updateSuggestionsState('');
    this.phoneInput()?.nativeElement.focus();
  }

  isValid(): boolean {
    if (!this.enableValidation()) return true;
    const activeCountry = this.selectedCountry();
    if (!activeCountry || !this.inputValue) return false;
    return this.phoneService.isValidNumber(this.inputValue, activeCountry.code);
  }

  private validateSelf(): void {
    const isSearchQuery = this.allowAlphanumeric() && /[a-zA-Z]/.test(this.inputValue);
    if (this.inputValue && !isSearchQuery && !this.isValid()) {
      this.hasError = true;
    } else {
      this.hasError = false;
    }
  }

  private propagateChanges(): void {
    this.validateSelf();
    const activeCountry = this.selectedCountry();

    if (!this.inputValue || !activeCountry) {
      this.onChange(null);
      this.valueChange.emit(null);
      return;
    }

    const valueObject = this.phoneService.parsePhoneNumber(this.inputValue, activeCountry);
    const outputValue = this.valueFormat() === 'object' 
      ? valueObject 
      : (this.isValid() ? this.phoneService.formatE164(this.inputValue, activeCountry.code) : this.inputValue);

    this.onChange(outputValue);
    this.valueChange.emit(outputValue);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Triggers change detection on window resize to reposition and resize overlay
  }

  getOverlayWidth(): number {
    const el = this.containerEl()?.nativeElement;
    if (el && typeof el.getBoundingClientRect === 'function') {
      return el.getBoundingClientRect().width;
    }
    return 320;
  }

  // --- ControlValueAccessor ---

  writeValue(value: any): void {
    if (!value) {
      this.inputValue = '';
      this.validateSelf();
      return;
    }

    if (typeof value === 'object') {
      const countryCode = value.countryCode || value.code;
      const numberToFormat = value.number || value.formattedNumber || '';

      if (countryCode) {
        const found = this.phoneService.getStaticCountries().find(
          c => c.code.toUpperCase() === countryCode.toUpperCase()
        );
        if (found) {
          this.selectedCountry.set(found);
          const rawDigits = numberToFormat.replace(/\D/g, '');
          this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, found.code);
          this.validateSelf();
          return;
        }
      }
    }

    if (typeof value === 'string' && value.startsWith('+')) {
      const detected = this.phoneService.detectCountryByDialCode(value);
      if (detected) {
        this.selectedCountry.set(detected);
        const cleanInput = value.replace(detected.dialCode, '').replace('+', '');
        const rawDigits = cleanInput.replace(/\D/g, '');
        this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, detected.code);
        this.validateSelf();
        return;
      }
    }

    const currentCountry = this.selectedCountry();
    if (currentCountry) {
      const rawDigits = String(value).replace(/\D/g, '');
      this.inputValue = this.phoneService.formatPhoneNumber(rawDigits, currentCountry.code);
    } else {
      this.inputValue = String(value);
    }
    this.validateSelf();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // --- Validator ---

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    return this.isValid() ? null : { invalidPhoneNumber: true };
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen()) {
      this.closeOverlay();
    }
  }
}
