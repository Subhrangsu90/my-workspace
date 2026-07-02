import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideNgTelInputAutocomplete } from 'ng-tel-input-autocomplete';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideNgTelInputAutocomplete({
      defaultCountry: 'US',
      flagMode: 'emoji',
      validationEnabled: true,
      resetCountryOnClear: false,
      size: 'small',
    }),
  ],
};
