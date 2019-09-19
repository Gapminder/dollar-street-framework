import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeHtml'
})
export class HtmlSanitizerPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      value
        .replace(/^\<p\>/, '')
        .replace(/\<\/p\>$/, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    );
  }
}
