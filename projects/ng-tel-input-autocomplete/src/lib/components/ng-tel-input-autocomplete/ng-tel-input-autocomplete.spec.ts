import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTelInputAutocomplete } from './ng-tel-input-autocomplete';
import { provideNgTelInputAutocomplete } from '../../config/ng-tel-input-autocomplete.config';
import { PhoneInputValue, PhoneNumberValue } from '../../models/ng-tel-input-autocomplete.types';

@Component({
  standalone: true,
  imports: [FormsModule, NgTelInputAutocomplete],
  template: `
    <label for="template-phone">Phone</label>
    <ng-tel-input-autocomplete
      inputId="template-phone"
      name="phone"
      [(ngModel)]="phone"
      [suggestionsEnabled]="false"
    />
  `,
})
class TemplateDrivenHost {
  phone = '+12025550143';
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgTelInputAutocomplete],
  template: `
    <label for="reactive-phone">Phone</label>
    <ng-tel-input-autocomplete
      inputId="reactive-phone"
      [formControl]="phone"
      [suggestionsEnabled]="false"
    />
  `,
})
class ReactiveFormsHost {
  readonly phone = new FormControl<PhoneInputValue>(null, { validators: [Validators.required] });
}

@Component({
  standalone: true,
  imports: [NgTelInputAutocomplete],
  template: `
    <ng-template #selected let-country>
      <span class="custom-selected">{{ country.code }}</span>
    </ng-template>
    <ng-template #country let-item let-selected="selected">
      <span class="custom-country">{{ item.code }}:{{ selected }}</span>
    </ng-template>
    <ng-template #suggestion let-item let-index="index">
      <span class="custom-suggestion">{{ index }}:{{ item.name }}</span>
    </ng-template>
    <ng-tel-input-autocomplete
      [selectedCountryTemplate]="selected"
      [countryTemplate]="country"
      [suggestionTemplate]="suggestion"
      [suggestions]="suggestions"
    />
  `,
})
class CustomTemplateHost {
  readonly telephoneInput = viewChild.required(NgTelInputAutocomplete);
  readonly suggestions = [{ name: 'Asha', phoneNumber: '+919876543210', countryCode: 'IN' }];
}

describe('NgTelInputAutocomplete', () => {
  let component: NgTelInputAutocomplete;
  let fixture: ComponentFixture<NgTelInputAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgTelInputAutocomplete],
    }).compileComponents();

    fixture = TestBed.createComponent(NgTelInputAutocomplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore the configured default country when the form value is reset', async () => {
    fixture.componentRef.setInput('defaultCountry', 'IN');
    await fixture.whenStable();

    component.writeValue({ countryCode: 'EG', number: '1012345678' });
    expect(component.selectedCountry()?.code).toBe('EG');

    component.writeValue(null);
    await fixture.whenStable();

    expect(component.inputValue()).toBe('');
    expect(component.selectedCountry()?.code).toBe('IN');
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('');
  });

  it('should only suggest a country for an explicit international prefix', () => {
    component.updateSuggestedCountry('202-555-0123');
    expect(component.suggestedCountry()).toBeNull();

    component.updateSuggestedCountry('+20 10 1234 5678');
    expect(component.suggestedCountry()?.code).toBe('EG');

    component.updateSuggestedCountry('0044 20 7946 0958');
    expect(component.suggestedCountry()?.dialCode).toBe('+44');
  });

  it('should not add a click-blocking backdrop to the suggestions overlay', async () => {
    component.showSuggestions.set(true);
    await fixture.whenStable();

    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
  });

  it('should expose combobox semantics and an accessible country listbox', async () => {
    const input = fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement;
    const trigger = fixture.nativeElement.querySelector(
      '.ngti-country-trigger',
    ) as HTMLButtonElement;

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-label')).toBe('International phone number');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');

    trigger.click();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
      'Countries',
    );
  });

  it('should generate unique IDs for separate component instances', async () => {
    const secondFixture = TestBed.createComponent(NgTelInputAutocomplete);
    await secondFixture.whenStable();

    const firstId = (fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement)
      .id;
    const secondId = (
      secondFixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement
    ).id;

    expect(firstId).not.toBe(secondId);
    secondFixture.destroy();
  });

  it('should use offline emoji flags by default', () => {
    expect(fixture.nativeElement.querySelector('.ngti-flag-emoji')?.textContent?.trim()).toBe('🇺🇸');
    expect(fixture.nativeElement.querySelector('img.ngti-flag-image')).toBeNull();
  });

  it('should show the selected country example number as the default placeholder', async () => {
    const input = fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement;

    expect(input.placeholder).toBe(component.selectedCountry()?.placeholder);

    fixture.componentRef.setInput('defaultCountry', 'IN');
    await fixture.whenStable();

    expect(input.placeholder).toBe(component.selectedCountry()?.placeholder);
  });

  it('should let a custom placeholder override the selected country example number', async () => {
    fixture.componentRef.setInput('placeholder', 'Search phone or contact...');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement;
    expect(input.placeholder).toBe('Search phone or contact...');
  });
  it('should pass native input attributes and readonly state to the rendered input', async () => {
    fixture.componentRef.setInput('name', 'workPhone');
    fixture.componentRef.setInput('autocomplete', 'tel-national');
    fixture.componentRef.setInput('inputMode', 'numeric');
    fixture.componentRef.setInput('enterKeyHint', 'done');
    fixture.componentRef.setInput('pattern', '[0-9]+');
    fixture.componentRef.setInput('minLength', 4);
    fixture.componentRef.setInput('maxLength', 20);
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('spellcheck', true);
    fixture.componentRef.setInput('ariaDescribedBy', 'phone-help');
    fixture.componentRef.setInput('ariaLabelledBy', 'phone-label');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement;
    const trigger = fixture.nativeElement.querySelector(
      '.ngti-country-trigger',
    ) as HTMLButtonElement;

    expect(input.getAttribute('name')).toBe('workPhone');
    expect(input.getAttribute('autocomplete')).toBe('tel-national');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('enterkeyhint')).toBe('done');
    expect(input.getAttribute('pattern')).toBe('[0-9]+');
    expect(input.getAttribute('minlength')).toBe('4');
    expect(input.getAttribute('maxlength')).toBe('20');
    expect(input.readOnly).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute('spellcheck')).toBe('true');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBe('phone-label');
    expect(input.getAttribute('aria-describedby')).toBe('phone-help');
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(trigger.disabled).toBe(true);

    component.inputValue.set('123');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.ngti-clear-button')).toBeNull();

    component.toggleOverlay(new MouseEvent('click'));
    expect(component.isOpen()).toBe(false);

    component.hasError.set(true);
    await fixture.whenStable();
    expect(input.getAttribute('aria-describedby')).toBe(`phone-help ${component.inputId()}-error`);

    component.writeValue('+12025550143');
    await fixture.whenStable();
    expect(component.inputValue()).toContain('202');
  });
  it('should apply custom class and style inputs to rendered parts', async () => {
    fixture.componentRef.setInput('containerClass', 'custom-shell');
    fixture.componentRef.setInput('containerStyle', { borderRadius: '4px' });
    fixture.componentRef.setInput('countryButtonClass', 'custom-trigger');
    fixture.componentRef.setInput('countryButtonStyle', { color: 'rgb(12, 34, 56)' });
    fixture.componentRef.setInput('inputClass', ['custom-input']);
    fixture.componentRef.setInput('inputStyle', { backgroundColor: 'rgb(250, 250, 250)' });
    fixture.componentRef.setInput('actionsClass', { 'custom-actions': true });
    fixture.componentRef.setInput('actionsStyle', { paddingRight: '12px' });
    fixture.componentRef.setInput('dropdownClass', 'custom-dropdown');
    fixture.componentRef.setInput('dropdownStyle', { maxHeight: '12rem' });
    component.isOpen.set(true);
    await fixture.whenStable();

    const shell = fixture.nativeElement.querySelector('.ngti-input-shell') as HTMLElement;
    const trigger = fixture.nativeElement.querySelector('.ngti-country-trigger') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input[type="tel"]') as HTMLInputElement;
    const actions = fixture.nativeElement.querySelector('.ngti-actions') as HTMLElement;
    const dropdown = document.querySelector('.custom-dropdown') as HTMLElement;

    expect(shell.classList.contains('custom-shell')).toBe(true);
    expect(shell.style.borderRadius).toBe('4px');
    expect(trigger.classList.contains('custom-trigger')).toBe(true);
    expect(trigger.style.color).toBe('rgb(12, 34, 56)');
    expect(input.classList.contains('custom-input')).toBe(true);
    expect(input.style.backgroundColor).toBe('rgb(250, 250, 250)');
    expect(actions.classList.contains('custom-actions')).toBe(true);
    expect(actions.style.paddingRight).toBe('12px');
    expect(dropdown.style.maxHeight).toBe('12rem');

    component.isOpen.set(false);
    await fixture.whenStable();
  });

  it('should emit null form values while alphabetic contact search text is entered', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    component.onInputChange({ target: { value: 'Asha' } } as unknown as Event);

    expect(component.inputValue()).toBe('Asha');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('should emit a typed object when object value format is configured', async () => {
    const onChange = vi.fn();
    fixture.componentRef.setInput('outputFormat', 'object');
    component.registerOnChange(onChange);
    await fixture.whenStable();

    component.onInputChange({ target: { value: '2025550143' } } as unknown as Event);

    const emitted = onChange.mock.lastCall?.[0] as PhoneNumberValue;
    expect(emitted.countryCode).toBe('US');
    expect(emitted.number).toBe('2025550143');
  });

  it('should emit complete, focus, blur, key, clear, and lazy-load events', async () => {
    const completeMethod = vi.fn();
    const inputFocus = vi.fn();
    const inputBlur = vi.fn();
    const inputKeydown = vi.fn();
    const inputKeyup = vi.fn();
    const clear = vi.fn();
    const lazyLoad = vi.fn();

    fixture.componentRef.setInput('suggestions', [
      { name: 'Asha', phoneNumber: '+919876543210', countryCode: 'IN' },
    ]);
    component.completeMethod.subscribe(completeMethod);
    component.inputFocus.subscribe(inputFocus);
    component.inputBlur.subscribe(inputBlur);
    component.inputKeydown.subscribe(inputKeydown);
    component.inputKeyup.subscribe(inputKeyup);
    component.clear.subscribe(clear);
    component.lazyLoad.subscribe(lazyLoad);
    await fixture.whenStable();

    const inputEvent = new Event('input');
    component.onFocus(new FocusEvent('focus'));
    component.onInputChange({ ...inputEvent, target: { value: 'Asha' } } as unknown as Event);
    component.handleInputKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.handleInputKeyUp(new KeyboardEvent('keyup', { key: 'a' }));
    component.onLoadMoreSuggestions();
    component.clearValue();
    component.onBlur(new FocusEvent('blur'));

    expect(inputFocus).toHaveBeenCalled();
    expect(completeMethod).toHaveBeenCalledWith(expect.objectContaining({ query: 'Asha' }));
    expect(inputKeydown).toHaveBeenCalledWith(expect.objectContaining({ key: 'ArrowDown' }));
    expect(inputKeyup).toHaveBeenCalledWith(expect.objectContaining({ key: 'a' }));
    expect(lazyLoad).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suggestions', query: 'Asha' }),
    );
    expect(clear).toHaveBeenCalled();
    expect(inputBlur).toHaveBeenCalled();
  });

  it('should emit select, dropdown click, and overlay lifecycle events', async () => {
    const suggestionSelect = vi.fn();
    const countrySelect = vi.fn();
    const dropdownClick = vi.fn();
    const overlayShow = vi.fn();
    const overlayHide = vi.fn();

    component.suggestionSelect.subscribe(suggestionSelect);
    component.countrySelect.subscribe(countrySelect);
    component.dropdownClick.subscribe(dropdownClick);
    component.overlayShow.subscribe(overlayShow);
    component.overlayHide.subscribe(overlayHide);
    await fixture.whenStable();

    const clickEvent = new MouseEvent('click');
    component.toggleOverlay(clickEvent);
    component.closeOverlay();
    component.onCountrySelected(component.countries()[1]);
    component.selectSuggestion({ name: 'Asha', phoneNumber: '+919876543210', countryCode: 'IN' });

    expect(dropdownClick).toHaveBeenCalledWith(
      expect.objectContaining({ originalEvent: clickEvent, open: true }),
    );
    expect(overlayShow).toHaveBeenCalledWith({ type: 'countries' });
    expect(overlayHide).toHaveBeenCalledWith({ type: 'countries' });
    expect(countrySelect).toHaveBeenCalledWith(
      expect.objectContaining({ country: component.countries()[1] }),
    );
    expect(suggestionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ suggestion: expect.objectContaining({ name: 'Asha' }) }),
    );
  });

  it('should support reactive forms value writes, validation, touched state, and disabling', async () => {
    const hostFixture = TestBed.createComponent(ReactiveFormsHost);
    await hostFixture.whenStable();

    const phoneControl = hostFixture.componentInstance.phone;
    const input = hostFixture.nativeElement.querySelector('#reactive-phone') as HTMLInputElement;

    expect(phoneControl.hasError('required')).toBe(true);
    expect(input.required).toBe(false);

    phoneControl.setValue('+12025550143');
    await hostFixture.whenStable();

    expect(input.value).toContain('202');
    expect(phoneControl.valid).toBe(true);

    input.value = '4155550134';
    input.dispatchEvent(new Event('input'));
    await hostFixture.whenStable();

    expect(phoneControl.value).toBe('+14155550134');

    input.dispatchEvent(new Event('blur'));
    await hostFixture.whenStable();
    expect(phoneControl.touched).toBe(true);

    phoneControl.disable();
    await hostFixture.whenStable();
    expect(input.disabled).toBe(true);

    phoneControl.enable();
    await hostFixture.whenStable();
    expect(input.disabled).toBe(false);

    hostFixture.destroy();
  });

  it('should leave Angular required validation to the consuming form control', async () => {
    const hostFixture = TestBed.createComponent(ReactiveFormsHost);
    await hostFixture.whenStable();

    const phoneControl = hostFixture.componentInstance.phone;
    const input = hostFixture.nativeElement.querySelector('#reactive-phone') as HTMLInputElement;

    expect(phoneControl.hasError('required')).toBe(true);
    expect(input.required).toBe(false);

    hostFixture.destroy();
  });

  it('should report invalid phone errors and allow validation to be disabled', async () => {
    const control = new FormControl<PhoneInputValue>('123');

    component.writeValue('123');
    expect(component.validate(control)).toEqual({ invalidPhoneNumber: true });

    fixture.componentRef.setInput('validationEnabled', false);
    await fixture.whenStable();

    expect(component.validate(control)).toBeNull();
    expect(component.isValid()).toBe(true);
  });

  it('should reset the selected country on clear when configured', async () => {
    fixture.componentRef.setInput('defaultCountry', 'IN');
    fixture.componentRef.setInput('resetCountryOnClear', true);
    await fixture.whenStable();

    component.writeValue({ countryCode: 'EG', number: '1012345678' });
    expect(component.selectedCountry()?.code).toBe('EG');

    component.clearValue();
    await fixture.whenStable();

    expect(component.inputValue()).toBe('');
    expect(component.selectedCountry()?.code).toBe('IN');
  });

  it('should use application-wide defaults from provideNgTelInputAutocomplete', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NgTelInputAutocomplete],
      providers: [
        provideNgTelInputAutocomplete({
          defaultCountry: 'IN',
          flagMode: 'image',
          suggestionsEnabled: false,
          validationEnabled: false,
          resetCountryOnClear: true,
          size: 'small',
        }),
      ],
    }).compileComponents();

    const configuredFixture = TestBed.createComponent(NgTelInputAutocomplete);
    const configured = configuredFixture.componentInstance;
    await configuredFixture.whenStable();

    expect(configured.defaultCountry()).toBe('IN');
    expect(configured.selectedCountry()?.code).toBe('IN');
    expect(configured.flagMode()).toBe('image');
    expect(configured.suggestionsEnabled()).toBe(false);
    expect(configured.validationEnabled()).toBe(false);
    expect(configured.resetCountryOnClear()).toBe(true);
    expect(configured.size()).toBe('small');

    configuredFixture.destroy();
  });

  it('should support template-driven forms', async () => {
    const hostFixture = TestBed.createComponent(TemplateDrivenHost);
    await hostFixture.whenStable();

    const input = hostFixture.nativeElement.querySelector('#template-phone') as HTMLInputElement;
    expect(input.value).toContain('202');

    input.value = '4155550134';
    input.dispatchEvent(new Event('input'));
    await hostFixture.whenStable();

    expect(hostFixture.componentInstance.phone).toBe('+14155550134');
    hostFixture.destroy();
  });

  it('should render custom selected-country, country, and suggestion templates', async () => {
    const hostFixture = TestBed.createComponent(CustomTemplateHost);
    await hostFixture.whenStable();

    expect(hostFixture.nativeElement.querySelector('.custom-selected')?.textContent).toBe('US');

    hostFixture.componentInstance.telephoneInput().isOpen.set(true);
    await hostFixture.whenStable();
    const countryOptions = Array.from(document.querySelectorAll('.custom-country'));
    expect(countryOptions[0]?.textContent).toMatch(/^[A-Z]{2}:false$/);

    hostFixture.componentInstance.telephoneInput().showSuggestions.set(true);
    await hostFixture.whenStable();
    expect(document.querySelector('.custom-suggestion')?.textContent).toBe('0:Asha');

    hostFixture.destroy();
  });
});
