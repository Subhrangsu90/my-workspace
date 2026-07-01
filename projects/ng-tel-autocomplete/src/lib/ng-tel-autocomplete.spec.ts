import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgTelAutocomplete } from './ng-tel-autocomplete';

describe('NgTelAutocomplete', () => {
  let component: NgTelAutocomplete;
  let fixture: ComponentFixture<NgTelAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgTelAutocomplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgTelAutocomplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
