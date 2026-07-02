import { Component, signal, OnInit, DestroyRef, inject } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgTelInputAutocomplete } from 'ng-tel-input-autocomplete';
import { PhoneInputValue, PhoneSuggestion } from 'ng-tel-input-autocomplete';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const MOCK_CONTACTS: PhoneSuggestion[] = [
  { name: 'John Doe', phoneNumber: '+12025550143', subtitle: 'Google - Software Engineer (US)' },
  { name: 'Jane Smith', phoneNumber: '+12025550189', subtitle: 'Microsoft - Product Manager (US)' },
  {
    name: 'Alice Johnson',
    phoneNumber: '+447911123456',
    subtitle: 'London Office - HR Director (UK)',
  },
  {
    name: 'Bob Williams',
    phoneNumber: '+447911654321',
    subtitle: 'London Office - Lead Architect (UK)',
  },
  {
    name: 'Charlie Brown',
    phoneNumber: '+491701234567',
    subtitle: 'Berlin Office - Managing Director (DE)',
  },
  { name: 'Diana Prince', phoneNumber: '+491709876543', subtitle: 'Berlin Office - QA Lead (DE)' },
  {
    name: 'Ethan Hunt',
    phoneNumber: '+33612345678',
    subtitle: 'Paris Office - Security Advisor (FR)',
  },
  {
    name: 'Fiona Gallagher',
    phoneNumber: '+33687654321',
    subtitle: 'Paris Office - Lead Designer (FR)',
  },
  {
    name: 'George Clark',
    phoneNumber: '+919876543210',
    subtitle: 'Mumbai Office - Engineering Manager (IN)',
  },
  {
    name: 'Hannah Abbott',
    phoneNumber: '+919999888877',
    subtitle: 'Mumbai Office - Project Coordinator (IN)',
  },
  {
    name: 'Ian Malcolm',
    phoneNumber: '+13105550122',
    subtitle: 'LA Office - Chief Scientist (US)',
  },
  {
    name: 'Julia Roberts',
    phoneNumber: '+13105550144',
    subtitle: 'LA Office - Public Relations (US)',
  },
  {
    name: 'Kevin Bacon',
    phoneNumber: '+14155550199',
    subtitle: 'SF Office - Security Specialist (US)',
  },
  { name: 'Laura Croft', phoneNumber: '+442079460192', subtitle: 'London - Senior Inspector (UK)' },
  { name: 'Mike Tyson', phoneNumber: '+17025550155', subtitle: 'Vegas - Sports Consultant (US)' },
  {
    name: 'Nancy Wheeler',
    phoneNumber: '+13175550172',
    subtitle: 'Indiana Office - Investigative Journalist (US)',
  },
  {
    name: 'Oliver Queen',
    phoneNumber: '+12065550163',
    subtitle: 'Seattle Head - Chief Executive (US)',
  },
  { name: 'Peter Parker', phoneNumber: '+17185550188', subtitle: 'NY Office - Photographer (US)' },
  {
    name: 'Quentin Tarantino',
    phoneNumber: '+13105550177',
    subtitle: 'LA Office - Creative Director (US)',
  },
  { name: 'Rachel Green', phoneNumber: '+12125550198', subtitle: 'NY - Senior Buyer (US)' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgTelInputAutocomplete],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Form group definition
  protected readonly testForm = this.fb.group({
    phoneAutocomplete: ['', [Validators.required]],
    phoneNormal: ['', [Validators.required]],
  });

  // State signals
  protected readonly suggestions = signal<PhoneSuggestion[]>([]);
  protected readonly loading = signal(false);
  protected readonly suggestionsExhausted = signal(false);
  protected readonly isFormDisabled = signal(false);
  protected readonly defaultCountry = signal('IN');
  protected readonly contactSearchEnabled = signal(false);
  protected readonly validationEnabled = signal(true);
  protected readonly templatePhone = signal('+919876543210');
  protected readonly objectValue = signal<PhoneInputValue>(null);
  protected readonly darkPhone = signal<PhoneInputValue>(null);

  private readonly querySubject = new Subject<string>();
  private currentQuery = '';
  private currentPage = 0;
  private readonly pageSize = 5;

  ngOnInit() {
    // Listen to query changes with debounce
    this.querySubject
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.currentQuery = query;
        this.currentPage = 0;
        this.suggestionsExhausted.set(false);
        this.fetchSuggestions(query, true);
      });
  }

  // Handle manual typing from telephone input
  protected onQueryChange(query: string) {
    this.loading.set(true);
    this.querySubject.next(query);
  }

  // Handle changes to default country config
  protected onDefaultCountryChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.defaultCountry.set(value);
  }

  // Handle changes to alphanumeric permission config
  protected onAlphanumericChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.contactSearchEnabled.set(checked);
  }

  // Handle changes to validation config
  protected onValidationChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.validationEnabled.set(checked);
  }

  // Handle infinite scroll triggering load more
  protected onLoadMore() {
    if (this.loading() || this.suggestionsExhausted()) return;

    this.currentPage++;
    this.loading.set(true);
    this.fetchSuggestions(this.currentQuery, false);
  }

  // Toggle Form Control disabled state
  protected toggleDisabledState() {
    this.isFormDisabled.update((val) => !val);
    if (this.isFormDisabled()) {
      this.testForm.controls.phoneAutocomplete.disable();
      this.testForm.controls.phoneNormal.disable();
    } else {
      this.testForm.controls.phoneAutocomplete.enable();
      this.testForm.controls.phoneNormal.enable();
    }
  }

  // Reset form control value
  protected resetForm() {
    this.testForm.controls.phoneAutocomplete.reset();
    this.testForm.controls.phoneNormal.reset();
  }

  // Set initial sample value
  protected setSampleValue() {
    this.testForm.controls.phoneAutocomplete.setValue('+447911123456');
    this.testForm.controls.phoneNormal.setValue('+447911123456');
  }

  // Fetch suggestions with simulated network latency
  private fetchSuggestions(query: string, reset: boolean) {
    setTimeout(() => {
      const normalizedQuery = query.replace(/[\s\-\+\(\)]/g, '').toLowerCase();

      const filtered = MOCK_CONTACTS.filter((contact) => {
        const phoneClean = contact.phoneNumber.replace(/[\s\-\+\(\)]/g, '').toLowerCase();
        const nameClean = (contact.name || '').toLowerCase();
        const subtitleClean = (contact.subtitle || '').toLowerCase();

        return (
          phoneClean.includes(normalizedQuery) ||
          nameClean.includes(normalizedQuery) ||
          subtitleClean.includes(normalizedQuery)
        );
      });

      const startIndex = this.currentPage * this.pageSize;
      const paginatedResults = filtered.slice(startIndex, startIndex + this.pageSize);

      if (reset) {
        this.suggestions.set(paginatedResults);
      } else {
        this.suggestions.update((curr) => [...curr, ...paginatedResults]);
      }

      if (startIndex + this.pageSize >= filtered.length) {
        this.suggestionsExhausted.set(true);
      }

      this.loading.set(false);
    }, 600); // 600ms latency to demonstrate loading spinner
  }
}
