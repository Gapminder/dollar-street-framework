import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TwitterPreviewComponent } from './twitter-preview.component';

const routes: Routes = [{ path: '', component: TwitterPreviewComponent }];

export const TwitterPreviewRouting: ModuleWithProviders = RouterModule.forChild(routes);
