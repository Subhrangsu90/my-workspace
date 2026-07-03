import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  Country,
  CountryTemplateContext,
  FlagMode,
  FlagUrlResolver,
  StateTemplateContext,
  SuggestionTemplateContext,
  PhoneSuggestion,
  NgTelInputClassValue,
  NgTelInputStyleValue,
} from '../../models/ng-tel-input-autocomplete.types';
import { NgTelInputIcon } from '../icon/ng-tel-input-icons';
import { escapeHtml, getFlagEmoji } from '../../utils/utils';

type DropdownItem = Country | PhoneSuggestion;

@Component({
  selector: 'ng-tel-input-dropdown',

  imports: [NgClass, NgStyle, NgTemplateOutlet, NgTelInputIcon],
  templateUrl: './ng-tel-input-dropdown.html',
  host: {
    '[attr.dir]': 'direction()',
  },
  styleUrls: ['../../styles/ng-tel-input-theme.css', './ng-tel-input-dropdown.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgTelInputDropdown implements OnChanges, AfterViewInit {
  readonly type = input.required<'countries' | 'suggestions'>();
  readonly items = input.required<readonly DropdownItem[]>();
  readonly idPrefix = input.required<string>();
  readonly selectedCountry = input<Country | null>(null);
  readonly searchQuery = input('');
  readonly loading = input(false);
  readonly hasMore = input(false);
  readonly activeIndex = input(0);
  readonly flagMode = input<FlagMode>('emoji');
  readonly direction = input<'ltr' | 'rtl' | 'auto' | null>(null);
  readonly flagUrl = input<FlagUrlResolver | null>(null);
  readonly countryTemplate = input<TemplateRef<CountryTemplateContext> | null>(null);
  readonly suggestionTemplate = input<TemplateRef<SuggestionTemplateContext> | null>(null);
  readonly emptyTemplate = input<TemplateRef<StateTemplateContext> | null>(null);
  readonly loadingTemplate = input<TemplateRef<StateTemplateContext> | null>(null);
  readonly panelClass = input<NgTelInputClassValue | null>(null);
  readonly panelStyle = input<NgTelInputStyleValue | null>(null);

  readonly itemSelected = output<DropdownItem>();
  readonly searchChanged = output<string>();
  readonly scrollEnd = output<void>();
  readonly closed = output<void>();
  readonly activeIndexChange = output<number>();

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly listContainer = viewChild<ElementRef<HTMLDivElement>>('listContainer');

  private readonly sanitizer = inject(DomSanitizer);

  get listboxId(): string {
    return `${this.idPrefix()}-${this.type()}-listbox`;
  }
  get searchInputId(): string {
    return `${this.idPrefix()}-country-search`;
  }
  get activeOptionId(): string | null {
    const item = this.items()[this.activeIndex()];
    if (!item) return null;
    return this.type() === 'countries'
      ? this.countryOptionId(item as Country)
      : this.suggestionOptionId(this.activeIndex());
  }
  get countriesCast(): readonly Country[] {
    return this.items() as readonly Country[];
  }
  get suggestionsCast(): readonly PhoneSuggestion[] {
    return this.items() as readonly PhoneSuggestion[];
  }

  ngOnChanges(changes: SimpleChanges): void {
    const itemsChange = changes['items'];
    const shouldScrollForItems =
      !!itemsChange &&
      !itemsChange.firstChange &&
      !this.isAppendOnlyChange(itemsChange.previousValue, itemsChange.currentValue);

    if (changes['activeIndex'] || shouldScrollForItems) {
      this.scrollActiveIntoView();
    }
  }

  ngAfterViewInit(): void {
    if (this.type() === 'countries') this.focusSearch();
  }

  countryOptionId(country: Country): string {
    return `${this.idPrefix()}-country-${country.code.toLowerCase()}`;
  }
  suggestionOptionId(index: number): string {
    return `${this.idPrefix()}-suggestion-${index}`;
  }
  getFlagUrl(countryCode: string): string {
    return this.flagUrl()?.(countryCode) ?? `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
  }

  flagEmoji(countryCode: string): string {
    return getFlagEmoji(countryCode);
  }

  focusSearch(): void {
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }
  onSearchInput(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchChanged.emit('');
    const inputElement = this.searchInput()?.nativeElement;
    if (inputElement) {
      inputElement.value = '';
      inputElement.focus();
    }
  }

  selectItem(item: DropdownItem): void {
    this.itemSelected.emit(item);
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    if (
      container.scrollHeight - container.scrollTop <= container.clientHeight + 30 &&
      !this.loading() &&
      this.hasMore()
    ) {
      this.scrollEnd.emit();
    }
  }

  getHighlightedText(text: string, search: string): SafeHtml {
    const escapedText = escapeHtml(text || '');
    if (!search) return escapedText;
    const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const highlighted = escapedText.replace(
      new RegExp(`(${escapedSearch})`, 'gi'),
      '<mark style="background:var(--ngti-color-highlight-bg,#dbeafe);color:var(--ngti-color-highlight-text,#172554);font-weight:700;border-radius:.2rem;padding:0 .05rem">$1</mark>',
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const list = this.items();
    if (list.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndexChange.emit((this.activeIndex() + 1) % list.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndexChange.emit((this.activeIndex() - 1 + list.length) % list.length);
        break;
      case 'Enter':
        event.preventDefault();
        this.selectItem(list[this.activeIndex()]);
        break;
      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
      case 'Tab':
        this.closed.emit();
        break;
    }
  }

  private isAppendOnlyChange(
    previousItems?: readonly DropdownItem[],
    currentItems?: readonly DropdownItem[],
  ): boolean {
    if (!previousItems || !currentItems || currentItems.length <= previousItems.length) {
      return false;
    }

    return previousItems.every((item, index) => currentItems[index] === item);
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const listElement = this.listContainer()?.nativeElement;
      const item = this.items()[this.activeIndex()];
      if (!listElement || !item) return;
      const optionId =
        this.type() === 'countries'
          ? this.countryOptionId(item as Country)
          : this.suggestionOptionId(this.activeIndex());
      const activeElement = listElement.querySelector<HTMLElement>(`#${optionId}`);
      if (typeof activeElement?.scrollIntoView === 'function') {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    });
  }
}
