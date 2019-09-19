import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { AboutComponent } from './about.component';

import { SharedModule } from '../shared';

import { AboutRouting } from './about.routing';

@NgModule({
  declarations: [AboutComponent],
  imports: [
    AboutRouting,
    HttpModule,
    RouterModule,
    CommonModule,
    SharedModule
  ],
  exports: [AboutComponent]
})

export class AboutModule {}
