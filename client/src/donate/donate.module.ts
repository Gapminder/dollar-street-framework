import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { DonateComponent } from './donate.component';
import { DonateService } from './donate.service';

import { DonateRouting } from './donate.routing';

import { SharedModule } from '../shared';
import { NumberOnlyDirective } from '../shared/only-numbers/only-number.directive';

@NgModule({
  declarations: [DonateComponent, NumberOnlyDirective],
  imports: [
    DonateRouting,
    HttpModule,
    RouterModule,
    CommonModule,
    SharedModule
  ],
  providers: [DonateService],
  exports: []
})

export class DonateModule {}
