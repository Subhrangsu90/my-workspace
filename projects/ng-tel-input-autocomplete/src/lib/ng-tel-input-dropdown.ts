import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Country, PhoneSuggestion } from './ng-tel-input-autocomplete.types';
import { NgTelInputIcon } from './ng-tel-input-icons';

@Component({
  selector: 'lib-ng-tel-input-dropdown',
  standalone: true,
  imports: [CommonModule, NgTelInputIcon],
  template: `
    <div 
      class="bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 flex flex-col z-50 overflow-hidden w-full text-sm text-gray-800"
      (keydown)="handleKeyDown($event)"
      tabindex="-1"
    >
      <!-- HEADER SECTION -->
      @if (type() === 'countries') {
        <!-- Search bar for Country List -->
        <div class="p-2 border-b border-gray-100 flex items-center bg-gray-50/80 gap-2 sticky top-0 z-10">
          <lib-tel-icon name="search" class="text-gray-400 shrink-0"></lib-tel-icon>
          <input 
            #searchInput
            type="text" 
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Search country, dial code..."
            class="w-full bg-transparent border-0 outline-none text-gray-800 placeholder-gray-400 py-1 text-sm focus:ring-0 focus:outline-none"
            id="country-search-input"
            autocomplete="off"
          />
          @if (searchQuery()) {
            <button 
              type="button" 
              (click)="clearSearch()"
              class="text-gray-400 hover:text-gray-600 focus:outline-none shrink-0"
              id="clear-search-btn"
            >
              <lib-tel-icon name="close" class="w-4 h-4"></lib-tel-icon>
            </button>
          }
        </div>
      } @else {
        <!-- Header for Suggested Contacts -->
        <div class="px-3.5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between select-none shrink-0">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <lib-tel-icon name="contact-phone" class="text-gray-400"></lib-tel-icon>
            Suggested Contacts
          </span>
          <span class="text-[9px] text-blue-500 font-semibold font-mono bg-blue-50 border border-blue-100/50 px-1.5 py-0.5 rounded">Use ↑↓ & Enter</span>
        </div>
      }

      <!-- LIST CONTAINER -->
      <div 
        #listContainer
        (scroll)="onScroll($event)"
        class="overflow-y-auto flex-1 divide-y divide-gray-100/50 max-h-60"
        [id]="type() === 'countries' ? 'countries-dropdown-list' : 'phone-suggestions-list'"
      >
        <!-- COUNTRIES MODE -->
        @if (type() === 'countries') {
          @for (country of countriesCast; track country.code; let index = $index) {
            <button 
              type="button"
              [id]="'country-item-' + country.code"
              (click)="selectItem(country)"
              [class.bg-gray-50]="index === activeIndex()"
              [class.bg-blue-50/70]="country.code === selectedCountry()?.code"
              [class.text-blue-900]="country.code === selectedCountry()?.code"
              class="w-full text-left px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors duration-150 hover:bg-gray-50/80 select-none border-0 border-b border-gray-100/50 outline-none"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- Flag Image -->
                <img
                  [src]="'https://flagcdn.com/' + country.code.toLowerCase() + '.svg'"
                  class="w-6 h-4.5 object-cover rounded-sm shadow-xs border border-gray-200/60 transition-transform duration-100 shrink-0"
                  [alt]="country.name"
                  referrerpolicy="no-referrer"
                />
                <!-- Country Name & Dial Code -->
                <div class="flex items-center gap-1.5 min-w-0">
                  <span 
                    class="font-medium text-gray-700 truncate"
                    [innerHTML]="getHighlightedText(country.name, searchQuery())"
                  ></span>
                  <span 
                    class="text-gray-400 font-mono text-xs font-semibold whitespace-nowrap"
                    [innerHTML]="getHighlightedText('(' + country.dialCode + ')', searchQuery())"
                  ></span>
                </div>
              </div>
              
              <div class="flex items-center gap-2 shrink-0">
                <!-- Checkmark for selected -->
                @if (country.code === selectedCountry()?.code) {
                  <lib-tel-icon name="check" class="text-blue-600 w-5 h-5"></lib-tel-icon>
                }
              </div>
            </button>
          } @empty {
            <div class="p-6 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <lib-tel-icon name="error" class="text-gray-300 w-8 h-8"></lib-tel-icon>
              <p class="font-medium text-gray-500">No countries found</p>
              <p class="text-xs text-gray-400">Try searching for another keyword</p>
            </div>
          }
        } 
        
        <!-- SUGGESTIONS MODE -->
        @else {
          @for (suggestion of suggestionsCast; track suggestion.phoneNumber; let index = $index) {
            <button
              type="button"
              [id]="'suggestion-item-' + index"
              (click)="selectItem(suggestion)"
              [class.bg-blue-50/40]="index === activeIndex()"
              [class.text-blue-900]="index === activeIndex()"
              class="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150 hover:bg-gray-50 select-none group border-0 outline-none"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- Avatar/Initials -->
                <div 
                  [class]="index === activeIndex() ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'"
                  class="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 transition-transform duration-100"
                >
                  {{ (suggestion.name || 'UN').substring(0, 2).toUpperCase() }}
                </div>
                
                <!-- Contact Details -->
                <div class="flex flex-col min-w-0">
                  <span 
                    class="font-semibold text-gray-700 leading-tight group-hover:text-gray-900 transition-colors"
                    [innerHTML]="getHighlightedText(suggestion.name || 'Unknown Contact', searchQuery())"
                  ></span>
                  <span 
                    class="text-gray-400 text-xs font-mono mt-1"
                    [innerHTML]="getHighlightedText(suggestion.phoneNumber, searchQuery())"
                  ></span>
                  @if (suggestion.subtitle) {
                    <span 
                      class="text-gray-400 text-[11px] mt-0.5 truncate"
                      [innerHTML]="getHighlightedText(suggestion.subtitle, searchQuery())"
                    ></span>
                  }
                </div>
              </div>

              <!-- Country Indicator -->
              @if (suggestion.countryCode) {
                <div class="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/50 shrink-0">
                  <img
                    [src]="'https://flagcdn.com/' + suggestion.countryCode.toLowerCase() + '.svg'"
                    class="w-5 h-3.5 object-cover rounded-xs border border-gray-200/60 shrink-0"
                    [alt]="suggestion.countryCode"
                    referrerpolicy="no-referrer"
                  />
                  <span class="text-[10px] font-bold text-gray-500 font-mono">
                    {{ suggestion.countryCode }}
                  </span>
                </div>
              }
            </button>
          } @empty {
            <div class="p-4 text-center text-sm text-gray-400 italic">
              No contacts or suggestions found
            </div>
          }
        }

        <!-- Loading spinner at the bottom for Infinite Scroll -->
        @if (loading()) {
          <div class="p-3 text-center text-blue-600 flex items-center justify-center gap-2 bg-gray-50/50">
            <svg class="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium text-gray-500 animate-pulse">Loading more...</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgTelInputDropdown implements OnChanges, AfterViewInit {
  type = input.required<'countries' | 'suggestions'>();
  items = input.required<any[]>();
  selectedCountry = input<Country | null>(null);
  searchQuery = input<string>('');
  loading = input<boolean>(false);
  hasMore = input<boolean>(false);
  activeIndex = input<number>(0);

  itemSelected = output<any>();
  searchChanged = output<string>();
  scrollEnd = output<void>();
  closed = output<void>();
  activeIndexChange = output<number>();

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  listContainer = viewChild<ElementRef<HTMLDivElement>>('listContainer');

  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.scrollActiveIntoView();
    }
    if (changes['activeIndex']) {
      this.scrollActiveIntoView();
    }
  }

  ngAfterViewInit(): void {
    if (this.type() === 'countries') {
      this.focusSearch();
    }
  }

  get countriesCast(): Country[] {
    return this.items() as Country[];
  }

  get suggestionsCast(): PhoneSuggestion[] {
    return this.items() as PhoneSuggestion[];
  }

  // Auto-focus search input when component is rendered
  focusSearch(): void {
    setTimeout(() => {
      this.searchInput()?.nativeElement.focus();
    }, 50);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChanged.emit(value);
  }

  clearSearch(): void {
    this.searchChanged.emit('');
    if (this.searchInput()) {
      this.searchInput()!.nativeElement.value = '';
      this.searchInput()!.nativeElement.focus();
    }
  }

  selectItem(item: any): void {
    this.itemSelected.emit(item);
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 30) {
      if (!this.loading() && this.hasMore()) {
        this.scrollEnd.emit();
      }
    }
  }

  getHighlightedText(text: string, search: string): SafeHtml {
    if (!text) return '';
    if (!search) {
      return this.escapeHtml(text);
    }
    const escapedText = this.escapeHtml(text);
    // Escape regex characters
    const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlighted = escapedText.replace(
      regex, 
      '<mark class="bg-blue-100 text-blue-950 font-bold px-0.5 rounded-sm">$1</mark>'
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&amp;quot;')
      .replace(/'/g, '&#039;');
  }

  handleKeyDown(event: KeyboardEvent): void {
    const list = this.items();
    if (!list || list.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIdx = (this.activeIndex() + 1) % list.length;
        this.activeIndexChange.emit(nextIdx);
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIdx = (this.activeIndex() - 1 + list.length) % list.length;
        this.activeIndexChange.emit(prevIdx);
        break;
      case 'Enter':
        event.preventDefault();
        if (list[this.activeIndex()]) {
          this.selectItem(list[this.activeIndex()]);
        }
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

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const listEl = this.listContainer()?.nativeElement;
      if (!listEl) return;

      const prefix = this.type() === 'countries' ? 'country-item-' : 'suggestion-item-';
      
      let activeEl: HTMLElement | null = null;
      if (this.type() === 'countries') {
        const activeCountry = this.items()[this.activeIndex()] as Country;
        if (activeCountry) {
          activeEl = listEl.querySelector(`[id="${prefix}${activeCountry.code}"]`) as HTMLElement;
        }
      } else {
        activeEl = listEl.querySelector(`[id="${prefix}${this.activeIndex()}"]`) as HTMLElement;
      }

      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 50);
  }
}
