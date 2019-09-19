import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({ selector: '[esc]' })
export class EscButtonDirective {
  @Input() watchEsc = true;
  @Input() stopEscPropagation = true;
  @Output('esc') esc = new EventEmitter<KeyboardEvent>();

  @HostListener('document:keydown.escape', ['$event'])
  onKeyDown($event: KeyboardEvent) {
    if (!this.watchEsc) {
      return;
    }

    if (this.stopEscPropagation) {
      $event.stopPropagation();
    }

    this.esc.emit($event);
  }
}
