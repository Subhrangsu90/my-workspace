import {
  Component,
  OnInit,
  TemplateRef,
  ElementRef,
  booleanAttribute,
  computed,
  signal,
  effect,
  forwardRef,
  inject,
  HostListener,
  Injector,
  DestroyRef,
  output,
  input,
  viewChild,
  ChangeDetectionStrategy,
  numberAttribute,
  untracked,
} from '@angular/core';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, of, Observable, timer } from 'rxjs';
import { debounce, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NgTelInputAutocompleteService } from '../../services/ng-tel-input-autocomplete.service';
import { NgTelInputDropdown } from '../dropdown/ng-tel-input-dropdown';
import { NgTelInputIcon } from '../icon/ng-tel-input-icons';
import { NG_TEL_INPUT_AUTOCOMPLETE_CONFIG } from '../../config/ng-tel-input-autocomplete.config';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteDropdownClickEvent,
  AutoCompleteLazyLoadEvent,
  AutoCompleteOverlayEvent,
  AutoCompleteSelectEvent,
  CountrySearchResponse,
  Country,
  CountrySelectEvent,
  CountryTemplateContext,
  FlagMode,
  FlagUrlResolver,
  PhoneInputValue,
  StateTemplateContext,
  SuggestionTemplateContext,
  PhoneNumberValue,
  PhoneSuggestion,
  NgTelInputClassValue,
  NgTelInputStyleValue,
} from '../../models/ng-tel-input-autocomplete.types';

let nextUniqueId = 0;
type DropdownItem = Country | PhoneSuggestion;

@Component({
  selector: 'ng-tel-input-autocomplete',
  standalone: true,
  imports: [OverlayModule, NgClass, NgStyle, NgTemplateOutlet, NgTelInputDropdown, NgTelInputIcon],
  templateUrl: './ng-tel-input-autocomplete.html',
  host: {
    '[attr.dir]': 'direction()',
  },
  styleUrls: ['../../styles/ng-tel-input-theme.css', './ng-tel-input-autocomplete.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgTelInputAutocomplete),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NgTelInputAutocomplete),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgTelInputAutocomplete implements OnInit, ControlValueAccessor, Validator {
  private readonly config = inject(NG_TEL_INPUT_AUTOCOMPLETE_CONFIG);
  private readonly phoneService = inject(NgTelInputAutocompleteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true, skipSelf: true });
  private readonly parentNgForm = inject(NgForm, { optional: true, skipSelf: true });

  // Inputs
  readonly inputId = input(`ng-tel-input-${++nextUniqueId}`);
  readonly ariaLabel = input('International phone number');
  readonly defaultCountry = input(this.config.defaultCountry);
  readonly allowedCountries = input<readonly string[]>(this.config.allowedCountries);
  readonly excludedCountries = input<readonly string[]>(this.config.excludedCountries);
  readonly outputFormat = input<'string' | 'object'>(this.config.outputFormat);
  readonly name = input<string | null>(null);
  readonly autocomplete = input(this.config.autocomplete);
  readonly inputMode = input(this.config.inputMode);
  readonly direction = input<'ltr' | 'rtl' | 'auto' | null>(null, { alias: 'dir' });
  readonly enterKeyHint = input<string | null>(null);
  readonly pattern = input<string | null>(null);
  readonly minLength = input<number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly min = input<number | null, unknown>(null, { transform: numberAttribute });
  readonly max = input<number | null, unknown>(null, { transform: numberAttribute });
  readonly step = input<number | 'any' | null>(null);
  readonly inputSize = input<number | null, unknown>(null, { transform: numberAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly readonlyInput = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly spellcheck = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly ariaDescribedBy = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly countrySearchUrl = input<string | null>(null);
  readonly suggestionsEnabled = input(this.config.suggestionsEnabled, {
    transform: booleanAttribute,
  });
  readonly contactSearchEnabled = input(this.config.contactSearchEnabled, {
    transform: booleanAttribute,
  });
  readonly validationEnabled = input(this.config.validationEnabled, {
    transform: booleanAttribute,
  });
  readonly minQueryLength = input<number | null, unknown>(this.config.minQueryLength, {
    transform: numberAttribute,
  });
  readonly delay = input<number | null, unknown>(this.config.delay, { transform: numberAttribute });
  readonly completeOnFocus = input(this.config.completeOnFocus, { transform: booleanAttribute });
  readonly showClear = input(this.config.showClear, { transform: booleanAttribute });
  readonly resetCountryOnClear = input(this.config.resetCountryOnClear, {
    transform: booleanAttribute,
  });
  readonly fluid = input(this.config.fluid, { transform: booleanAttribute });
  readonly variant = input<'filled' | 'outlined'>(this.config.variant);
  readonly size = input<'small' | 'large' | null>(this.config.size);
  readonly flagMode = input<FlagMode>(this.config.flagMode);
  readonly flagUrl = input<FlagUrlResolver | null>(this.config.flagUrl);
  readonly selectedCountryTemplate = input<TemplateRef<CountryTemplateContext> | null>(null);
  readonly countryTemplate = input<TemplateRef<CountryTemplateContext> | null>(null);
  readonly suggestionTemplate = input<TemplateRef<SuggestionTemplateContext> | null>(null);
  readonly emptyTemplate = input<TemplateRef<StateTemplateContext> | null>(null);
  readonly loadingTemplate = input<TemplateRef<StateTemplateContext> | null>(null);
  readonly containerClass = input<NgTelInputClassValue | null>(null);
  readonly containerStyle = input<NgTelInputStyleValue | null>(null);
  readonly countryButtonClass = input<NgTelInputClassValue | null>(null);
  readonly countryButtonStyle = input<NgTelInputStyleValue | null>(null);
  readonly inputClass = input<NgTelInputClassValue | null>(null);
  readonly inputStyle = input<NgTelInputStyleValue | null>(null);
  readonly actionsClass = input<NgTelInputClassValue | null>(null);
  readonly actionsStyle = input<NgTelInputStyleValue | null>(null);
  readonly dropdownClass = input<NgTelInputClassValue | null>(null);
  readonly dropdownStyle = input<NgTelInputStyleValue | null>(null);

  // Contact suggestion list inputs/outputs
  readonly suggestions = input<readonly PhoneSuggestion[]>([]);
  readonly suggestionsLoading = input(false, { transform: booleanAttribute });
  readonly suggestionsExhausted = input(false, { transform: booleanAttribute });

  readonly suggestionSearch = output<string>();
  readonly completeMethod = output<AutoCompleteCompleteEvent>();
  readonly loadMoreSuggestions = output<void>();
  readonly valueChange = output<PhoneInputValue>();
  readonly countryLoadError = output<unknown>();
  readonly suggestionSelect = output<AutoCompleteSelectEvent>();
  readonly countrySelect = output<CountrySelectEvent>();
  readonly inputFocus = output<Event>();
  readonly inputBlur = output<Event>();
  readonly dropdownClick = output<AutoCompleteDropdownClickEvent>();
  readonly clear = output<void>();
  readonly inputKeydown = output<KeyboardEvent>();
  readonly inputKeyup = output<KeyboardEvent>();
  readonly overlayShow = output<AutoCompleteOverlayEvent>();
  readonly overlayHide = output<AutoCompleteOverlayEvent>();
  readonly lazyLoad = output<AutoCompleteLazyLoadEvent>();

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

  // Component state
  inputValue = signal('');
  isFocused = signal(false);
  formDisabled = signal(false);
  hasError = signal(false);
  private readonly angularControlStateVersion = signal(0);
  private ngControl: NgControl | null = null;
  isDisabled = computed(() => this.disabled() || this.formDisabled());
  isReadOnly = computed(() => this.readOnly() || this.readonlyInput());
  private readonly isAngularControlInvalid = computed(() => {
    this.angularControlStateVersion();

    const control = this.ngControl?.control;
    if (!control) return false;

    const parentSubmitted =
      this.parentFormGroup?.submitted || this.parentNgForm?.submitted || false;
    return control.invalid && (control.dirty || control.touched || parentSubmitted);
  });
  isInvalid = computed(() => this.invalid() || this.hasError() || this.isAngularControlInvalid());
  private justSelectedSuggestion = false;

  // Pagination for Country dropdown
  private currentCountryPage = 1;
  private readonly countriesPerPage = 15;

  // Debounce search stream for countries
  private searchSubject = new Subject<string>();

  // Form Control Value Accessor callbacks
  private onChange: (value: PhoneInputValue) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  private getDefaultCountry(): Country | null {
    const initialCode = this.defaultCountry();
    const allowedCountries = this.getFilteredStaticCountries('');
    return (
      allowedCountries.find(
        (country) => country.code.toUpperCase() === initialCode.toUpperCase(),
      ) ??
      allowedCountries[0] ??
      null
    );
  }

  private getFilteredStaticCountries(query: string): Country[] {
    let list = this.phoneService.getStaticCountries();

    const only = this.allowedCountries();
    if (only && only.length > 0) {
      const upperOnly = only.map((c) => c.toUpperCase());
      list = list.filter((c) => upperOnly.includes(c.code.toUpperCase()));
    }

    const exclude = this.excludedCountries();
    if (exclude && exclude.length > 0) {
      const upperExclude = exclude.map((c) => c.toUpperCase());
      list = list.filter((c) => !upperExclude.includes(c.code.toUpperCase()));
    }

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.dialCode.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q),
      );
    }

    return list;
  }

  private getCountries(
    query: string,
    page: number,
    limit = this.countriesPerPage,
  ): Observable<CountrySearchResponse> {
    const hasFilters = this.allowedCountries().length > 0 || this.excludedCountries().length > 0;

    if (hasFilters || !this.countrySearchUrl()) {
      const filtered = this.getFilteredStaticCountries(query);
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

    return this.phoneService.searchCountries(query, page, limit, this.countrySearchUrl());
  }

  constructor() {
    effect(() => {
      const defaultCountry = this.getDefaultCountry();
      if (defaultCountry && !untracked(this.inputValue)) {
        this.selectedCountry.set(defaultCountry);
      }
    });

    effect(() => {
      this.validationEnabled();
      this.onValidatorChange();
    });
  }

  ngOnInit(): void {
    this.connectAngularControlState();

    // Initial seed of country dropdown list
    this.loadCountriesPage(1);

    // Setup debounced search subscription for countries
    this.searchSubject
      .pipe(
        debounce(() => timer(Math.max(0, this.delay() ?? 250))),
        distinctUntilChanged(),
        switchMap((query) => {
          this.currentCountryPage = 1;
          this.searchQuery.set(query);
          this.loadingCountries.set(true);
          this.activeCountryIndex.set(0);
          return this.getCountries(query, 1, this.countriesPerPage);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.countries.set(res.data);
          this.hasMoreCountries.set(res.meta.hasMore);
          this.loadingCountries.set(false);
        },
        error: (error) => {
          this.loadingCountries.set(false);
          this.countryLoadError.emit(error);
        },
      });
  }

  private loadCountriesPage(page: number, append = false): void {
    this.loadingCountries.set(true);
    this.getCountries(this.searchQuery(), page, this.countriesPerPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (append) {
            this.countries.update((current) => [...current, ...res.data]);
          } else {
            this.countries.set(res.data);
          }
          this.hasMoreCountries.set(res.meta.hasMore);
          this.loadingCountries.set(false);
        },
        error: (error) => {
          this.loadingCountries.set(false);
          this.countryLoadError.emit(error);
        },
      });
  }

  private connectAngularControlState(): void {
    this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
    const control = this.ngControl?.control;

    if (control) {
      control.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.updateAngularControlState();
      });
      control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.updateAngularControlState();
      });
    }

    this.parentFormGroup?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateAngularControlState();
    });
    this.parentNgForm?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateAngularControlState();
    });

    this.updateAngularControlState();
  }

  private updateAngularControlState(): void {
    this.angularControlStateVersion.update((version) => version + 1);
  }
  private setCountryOverlayOpen(open: boolean): void {
    if (this.isOpen() === open) return;
    this.isOpen.set(open);
    if (open) {
      this.overlayShow.emit({ type: 'countries' });
    } else {
      this.overlayHide.emit({ type: 'countries' });
    }
  }

  private setSuggestionsOpen(open: boolean): void {
    if (this.showSuggestions() === open) return;
    this.showSuggestions.set(open);
    if (open) {
      this.overlayShow.emit({ type: 'suggestions' });
    } else {
      this.overlayHide.emit({ type: 'suggestions' });
    }
  }

  toggleOverlay(event: MouseEvent): void {
    if (this.isDisabled() || this.isReadOnly()) return;
    this.dropdownClick.emit({ originalEvent: event, open: !this.isOpen() });
    if (this.isOpen()) {
      this.closeOverlay();
    } else {
      this.setCountryOverlayOpen(true);
      this.activeCountryIndex.set(0);
    }
  }

  closeOverlay(): void {
    this.setCountryOverlayOpen(false);
    this.phoneInput()?.nativeElement.focus();
  }

  onCountrySelected(country: Country, originalEvent?: Event): void {
    this.selectedCountry.set(country);

    // Reformat existing digits to fit the new country's pattern
    const rawDigits = this.inputValue().replace(/\D/g, '');
    this.inputValue.set(this.phoneService.formatPhoneNumber(rawDigits, country.code));

    const value = this.propagateChanges();
    this.countrySelect.emit({ originalEvent, country, value });
    this.closeOverlay();
  }

  onCountryDropdownItem(item: DropdownItem): void {
    if (this.isCountry(item)) {
      this.onCountrySelected(item);
    }
  }

  onSuggestionDropdownItem(item: DropdownItem): void {
    if (this.isPhoneSuggestion(item)) {
      this.selectSuggestion(item);
    }
  }

  private isCountry(item: DropdownItem): item is Country {
    return 'dialCode' in item && 'placeholder' in item;
  }

  private isPhoneSuggestion(item: DropdownItem): item is PhoneSuggestion {
    return 'phoneNumber' in item;
  }

  onSearchChanged(query: string): void {
    this.searchSubject.next(query);
  }

  onScrollEndCountries(): void {
    if (!this.loadingCountries() && this.hasMoreCountries()) {
      this.currentCountryPage++;
      this.lazyLoad.emit({
        type: 'countries',
        query: this.searchQuery(),
        page: this.currentCountryPage,
        rows: this.countriesPerPage,
        first: (this.currentCountryPage - 1) * this.countriesPerPage,
      });
      this.loadCountriesPage(this.currentCountryPage, true);
    }
  }

  updateSuggestedCountry(value: string): void {
    const isInternational = value.startsWith('+') || value.startsWith('00');
    if (!isInternational) {
      this.suggestedCountry.set(null);
      return;
    }

    const internationalValue = value.startsWith('00') ? value.slice(2) : value;
    const cleaned = internationalValue.replace(/\D/g, '');
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
    if (suggested && !this.isReadOnly()) {
      this.selectedCountry.set(suggested);
      const rawDigits = this.inputValue().replace(/\D/g, '');
      const cleanDial = suggested.dialCode.replace('+', '');
      let remainingDigits = rawDigits;
      if (rawDigits.startsWith(cleanDial)) {
        remainingDigits = rawDigits.substring(cleanDial.length);
      }
      this.inputValue.set(this.phoneService.formatPhoneNumber(remainingDigits, suggested.code));
      this.suggestedCountry.set(null);
      const value = this.propagateChanges();
      this.countrySelect.emit({ country: suggested, value });
      this.phoneInput()?.nativeElement.focus();
    }
  }

  updateSuggestionsState(value: string, originalEvent?: Event): void {
    if (this.isReadOnly() || !this.suggestionsEnabled() || !this.queryMeetsMinLength(value)) {
      this.setSuggestionsOpen(false);
      return;
    }
    // Notify parent query has changed to trigger suggestion updates
    this.suggestionSearch.emit(value);
    this.completeMethod.emit({ originalEvent, query: value });
    // Open overlay suggestions if we are focused and have suggestion list
    this.activeSuggestionIndex.set(0);
    this.setSuggestionsOpen(this.suggestions().length > 0 && this.isFocused());
  }

  selectSuggestion(suggestion: PhoneSuggestion, originalEvent?: Event): void {
    this.justSelectedSuggestion = true;
    let foundCountry: Country | undefined;

    if (suggestion.countryCode) {
      foundCountry = this.phoneService
        .getStaticCountries()
        .find((c) => c.code.toUpperCase() === suggestion.countryCode!.toUpperCase());
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
      this.inputValue.set(this.phoneService.formatPhoneNumber(localDigits, foundCountry.code));
      const value = this.propagateChanges();
      this.suggestionSelect.emit({ originalEvent, suggestion, value });
    } else {
      this.inputValue.set(suggestion.phoneNumber);
      const value = this.propagateChanges();
      this.suggestionSelect.emit({ originalEvent, suggestion, value });
    }
    this.closeSuggestions();
    this.phoneInput()?.nativeElement.focus();
  }

  closeSuggestions(): void {
    this.setSuggestionsOpen(false);
  }

  onLoadMoreSuggestions(): void {
    if (!this.suggestionsLoading() && !this.suggestionsExhausted()) {
      this.loadMoreSuggestions.emit();
      this.lazyLoad.emit({ type: 'suggestions', query: this.inputValue() });
    }
  }

  handleInputKeyDown(event: KeyboardEvent): void {
    this.inputKeydown.emit(event);

    if (this.isReadOnly()) return;

    if (!this.contactSearchEnabled()) {
      const allowedRegex = /^[0-9\-\+\(\)\s]$/;
      const isControlKey = event.key.length > 1;
      const isClipboardOrSelect = event.ctrlKey || event.metaKey;

      if (!isControlKey && !isClipboardOrSelect && !allowedRegex.test(event.key)) {
        event.preventDefault();
        return;
      }
    }

    if (!this.suggestionsEnabled()) return;
    if (!this.showSuggestions()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.setSuggestionsOpen(
          this.suggestions().length > 0 && this.queryMeetsMinLength(this.inputValue()),
        );
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
          this.selectSuggestion(list[this.activeSuggestionIndex()], event);
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

  handleInputKeyUp(event: KeyboardEvent): void {
    this.inputKeyup.emit(event);
  }

  onInputChange(event: Event): void {
    if (this.isReadOnly()) return;

    const value = (event.target as HTMLInputElement).value;

    if (value.startsWith('+') && !this.isOpen()) {
      this.setCountryOverlayOpen(true);
      this.searchQuery.set(value);
      this.searchSubject.next(value);
    }

    if (value.startsWith('+') && value.length > 1) {
      const detected = this.phoneService.detectCountryByDialCode(value);
      if (detected) {
        this.selectedCountry.set(detected);
        const cleanInput = value.replace(detected.dialCode, '').replace('+', '');
        const rawDigits = cleanInput.replace(/\D/g, '');
        this.inputValue.set(this.phoneService.formatPhoneNumber(rawDigits, detected.code));
        this.suggestedCountry.set(null);
        this.propagateChanges();
        this.updateSuggestionsState(this.inputValue(), event);
        return;
      }
    }

    this.updateSuggestedCountry(value);

    if (this.contactSearchEnabled()) {
      // Allow letters, spaces, and numbers so users can type contact names or contact IDs.
      const hasLetters = /[a-zA-Z]/.test(value);
      if (hasLetters) {
        this.inputValue.set(value);
      } else {
        const rawDigits = value.replace(/\D/g, '');
        const activeCountry = this.selectedCountry();
        if (activeCountry) {
          this.inputValue.set(this.phoneService.formatPhoneNumber(rawDigits, activeCountry.code));
        } else {
          this.inputValue.set(rawDigits);
        }
      }
    } else {
      // Reject letters and non-phone characters. Only allow digits and formatting symbols (+, -, (, ), spaces).
      const filteredValue = value.replace(/[^0-9\-\+\(\)\s]/g, '');
      const rawDigits = filteredValue.replace(/\D/g, '');
      const activeCountry = this.selectedCountry();
      if (activeCountry) {
        this.inputValue.set(this.phoneService.formatPhoneNumber(rawDigits, activeCountry.code));
      } else {
        this.inputValue.set(rawDigits);
      }
    }

    this.propagateChanges();
    this.updateAngularControlState();
    this.updateSuggestionsState(this.inputValue(), event);
  }

  onFocus(event: Event): void {
    this.inputFocus.emit(event);
    this.isFocused.set(true);
    if (this.justSelectedSuggestion) {
      this.justSelectedSuggestion = false;
      return;
    }
    if (!this.completeOnFocus() && !this.inputValue()) return;
    this.updateSuggestionsState(this.inputValue(), event);
  }

  onBlur(event: Event): void {
    this.inputBlur.emit(event);
    this.isFocused.set(false);
    this.onTouched();
    this.validateSelf();
    this.updateAngularControlState();

    setTimeout(() => {
      if (!this.isFocused()) {
        this.closeSuggestions();
      }
    }, 200);
  }

  clearValue(): void {
    if (this.isReadOnly()) return;

    this.inputValue.set('');
    if (this.resetCountryOnClear()) {
      this.selectedCountry.set(this.getDefaultCountry());
    }
    this.propagateChanges();
    this.updateAngularControlState();
    this.updateSuggestionsState('');
    this.clear.emit();
    this.phoneInput()?.nativeElement.focus();
  }

  isValid(): boolean {
    if (!this.validationEnabled()) return true;
    const activeCountry = this.selectedCountry();
    if (!activeCountry || !this.inputValue()) return false;
    return this.phoneService.isValidNumber(this.inputValue(), activeCountry.code);
  }

  private validateSelf(): void {
    const isSearchQuery = this.contactSearchEnabled() && /[a-zA-Z]/.test(this.inputValue());
    if (this.inputValue() && !isSearchQuery && !this.isValid()) {
      this.hasError.set(true);
    } else {
      this.hasError.set(false);
    }
  }

  private queryMeetsMinLength(value: string): boolean {
    const minQueryLength = this.minQueryLength();
    return minQueryLength === null || value.trim().length >= minQueryLength;
  }

  private isContactSearchQuery(value = this.inputValue()): boolean {
    return this.contactSearchEnabled() && /[a-zA-Z]/.test(value);
  }

  private formatDigitsForCountry(value: string, country: Country): string {
    const rawDigits = value.replace(/\D/g, '');
    return this.phoneService.formatPhoneNumber(rawDigits, country.code);
  }

  private setFormattedInputValue(value: string, country = this.selectedCountry()): void {
    if (country) {
      this.inputValue.set(this.formatDigitsForCountry(value, country));
    } else {
      this.inputValue.set(value.replace(/\D/g, ''));
    }
  }

  private propagateChanges(): PhoneInputValue {
    this.validateSelf();
    const activeCountry = this.selectedCountry();

    if (!this.inputValue() || !activeCountry) {
      this.onChange(null);
      this.valueChange.emit(null);
      return null;
    }

    if (this.suggestionsEnabled() && this.isContactSearchQuery()) {
      this.onChange(null);
      this.valueChange.emit(null);
      return null;
    }

    const valueObject = this.phoneService.parsePhoneNumber(this.inputValue(), activeCountry);
    const outputValue =
      this.outputFormat() === 'object'
        ? valueObject
        : this.isValid()
          ? this.phoneService.formatE164(this.inputValue(), activeCountry.code)
          : this.inputValue();

    this.onChange(outputValue);
    this.valueChange.emit(outputValue);
    return outputValue;
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

  get countryListboxId(): string {
    return `${this.inputId()}-countries-listbox`;
  }

  get suggestionsListboxId(): string {
    return `${this.inputId()}-suggestions-listbox`;
  }

  get activeSuggestionId(): string | null {
    if (!this.showSuggestions() || !this.suggestions()[this.activeSuggestionIndex()]) return null;
    return `${this.inputId()}-suggestion-${this.activeSuggestionIndex()}`;
  }

  get inputDescribedBy(): string | null {
    const describedBy = this.ariaDescribedBy()?.trim();
    const errorId = this.isInvalid() ? `${this.inputId()}-error` : null;
    return [describedBy, errorId].filter(Boolean).join(' ') || null;
  }

  getFlagUrl(countryCode: string): string {
    return this.flagUrl()?.(countryCode) ?? `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
  }

  // --- ControlValueAccessor ---

  writeValue(value: unknown): void {
    if (!value) {
      this.inputValue.set('');
      this.selectedCountry.set(this.getDefaultCountry());
      this.suggestedCountry.set(null);
      this.validateSelf();
      return;
    }

    if (typeof value === 'object' && value !== null) {
      const phoneValue = value as Partial<PhoneNumberValue> & { code?: string };
      const countryCode = phoneValue.countryCode || phoneValue.code;
      const numberToFormat = phoneValue.number || phoneValue.formattedNumber || '';

      if (countryCode) {
        const found = this.phoneService
          .getStaticCountries()
          .find((c) => c.code.toUpperCase() === countryCode.toUpperCase());
        if (found) {
          this.selectedCountry.set(found);
          this.inputValue.set(this.formatDigitsForCountry(numberToFormat, found));
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
        this.inputValue.set(this.phoneService.formatPhoneNumber(rawDigits, detected.code));
        this.validateSelf();
        return;
      }
    }

    this.setFormattedInputValue(String(value));
    this.validateSelf();
  }

  registerOnChange(fn: (value: PhoneInputValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
    fn();
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // --- Validator ---

  validate(control: AbstractControl): ValidationErrors | null {
    if (
      !this.validationEnabled() ||
      !control.value ||
      this.isContactSearchQuery(String(control.value))
    ) {
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
