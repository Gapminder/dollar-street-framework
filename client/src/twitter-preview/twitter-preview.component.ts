import { AfterViewInit, Component } from '@angular/core';
import { LoaderService } from '../common';
import { UrlParametersService } from '../url-parameters/url-parameters.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'twitter-preview',
  templateUrl: './twitter-preview.component.html',
  styleUrls: ['./twitter-preview.component.css']
})
export class TwitterPreviewComponent implements AfterViewInit {
  // TODO remove the component and move data to HTML template
  imageUrl: string;
  twitterUrl = 'https://twitter.com/intent/tweet';
  twitterFullLink: string;
  urlToMatrix: string;
  title = environment.SHARE_EMBED_TITLE;
  description = environment.SHARE_EMBED_DESCRIPTION;
  s3Bucket = environment.S3_BUCKET;
  s3ServerPrefix = environment.S3_SERVER_PREFIX;
  maxLettersInSentence = 150;
  host = location.host;

  constructor(private loaderService: LoaderService, private urlParametersService: UrlParametersService) {}

  ngAfterViewInit() {
    this.loaderService.setLoader(true);
    const allParameters = this.urlParametersService.getAllParameters();
    this.urlToMatrix = allParameters.url;
    const embed = allParameters.embed;
    this.imageUrl = `//${this.s3ServerPrefix}${this.s3Bucket}/shared/${
      environment.S3_EMBED_VERSION
    }/embed_${embed}.jpeg`;

    if (this.description.length > this.maxLettersInSentence) {
      this.description = `${this.description.slice(0, this.maxLettersInSentence)}...`;
    }
  }

  openTwitterLink() {
    this.twitterFullLink = `${this.twitterUrl}?url=${this.urlToMatrix}`;
    window.location.href = this.twitterFullLink;
  }
}
