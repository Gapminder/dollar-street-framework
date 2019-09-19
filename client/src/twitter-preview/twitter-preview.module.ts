import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { TwitterPreviewComponent } from './twitter-preview.component';
import { TwitterPreviewRouting } from './twitter-preview.routing';

@NgModule({
  declarations: [TwitterPreviewComponent],
  imports: [TwitterPreviewRouting, HttpModule, RouterModule, CommonModule]
})
export class TwitterPreviewModule {}
