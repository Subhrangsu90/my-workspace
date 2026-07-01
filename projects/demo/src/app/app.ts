import { Component, signal } from '@angular/core';
import { NgTelAutocomplete } from 'ng-tel-autocomplete';

@Component({
  selector: 'app-root',
  imports: [NgTelAutocomplete],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('demo');
}
