import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

import { environment } from './environments/environment';

if (['true', true].includes(environment.FLAG_BUILD_ANGULAR_PRODUCTION)) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
