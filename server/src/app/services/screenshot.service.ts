// Todo: Need refactor according to "noImplicitAny" rule

import { AwsS3Service } from './aws-s3.service';
import {
  DEFAULT_DOWNLOAD_SCREENSHOT_VIEWPORT,
  DEFAULT_EMBED_PREVIEW_CONTAINER,
  DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT,
  DEFAULT_SPLASH_WAIT_FOR_IMAGE,
  DOWNLOAD_IMAGE,
  EMBED_ERRORS,
  EMBED_REMOVE_PARAMS,
  MAX_SPLASH_SCREENSHOT_WIDTH,
  SPLASH_SCREENSHOT_TIMEOUT,
  TOOLS_FOR_CREATE_EMBED,
  EMBED_TITLE_CONTAINER
} from '../../../constants/embed-preview-constants';
import * as puppeteer from 'puppeteer';
import { EmbedParams } from '../../interfaces/puppeteer.interfaces';
import * as queryString from 'querystring';
import * as url from 'url';
import * as _ from 'lodash';
import * as http from 'http';
import * as request from 'request-promise-native';

export class ScreenshotService {
  readonly MODE_ENV: string;
  readonly NODE_ENV: string;
  readonly CLUSTER_PUPPETEER_EXTERNAL_IP: string;
  readonly CLUSTER_PUPPETEER_EXTERNAL_PORT: string;
  readonly CLUSTER_SPLASH_INTERNAL_IP: string;
  readonly CLUSTER_SPLASH_EXTERNAL_IP: string;
  readonly INSTANCE_SPLASH_PORT: string;
  readonly SPLASH_WAIT_FOR_IMAGE: string;
  readonly INTERNAL_SPLASH_BASEPATH: string;
  readonly EXTERNAL_SPLASH_BASEPATH: string;
  readonly SPLASH_SCREENSHOT_TIMEOUT: number;
  readonly MAX_SPLASH_SCREENSHOT_WIDTH: number;
  readonly DEFAULT_RESOLUTION: string = '480x480';
  readonly DEFAULT_SCREENSHOT = null;
  readonly DEFAULT_LANGUAGE: string = 'en';
  readonly DEFAULT_TOOL_FOR_CREATE_EMBED: string = TOOLS_FOR_CREATE_EMBED.puppeteerCluster;

  private readonly awsS3Service: AwsS3Service;

  constructor(nconf, awsS3Service: AwsS3Service) {
    // TODO: move to all credentials
    this.MODE_ENV = nconf.get('MODE_ENV');
    this.NODE_ENV = nconf.get('NODE_ENV');
    this.CLUSTER_PUPPETEER_EXTERNAL_IP = nconf.get('CLUSTER_PUPPETEER_EXTERNAL_IP');
    this.CLUSTER_PUPPETEER_EXTERNAL_PORT = nconf.get('CLUSTER_PUPPETEER_EXTERNAL_PORT');
    this.CLUSTER_SPLASH_INTERNAL_IP = nconf.get('CLUSTER_SPLASH_INTERNAL_IP');
    this.CLUSTER_SPLASH_EXTERNAL_IP = nconf.get('CLUSTER_SPLASH_EXTERNAL_IP');
    this.INSTANCE_SPLASH_PORT = nconf.get('INSTANCE_SPLASH_PORT');
    this.SPLASH_WAIT_FOR_IMAGE = nconf.get('SPLASH_WAIT_FOR_IMAGE') || DEFAULT_SPLASH_WAIT_FOR_IMAGE;
    this.INTERNAL_SPLASH_BASEPATH = `http://${this.CLUSTER_SPLASH_INTERNAL_IP}:${this.INSTANCE_SPLASH_PORT}`;
    this.EXTERNAL_SPLASH_BASEPATH = `http://${this.CLUSTER_SPLASH_EXTERNAL_IP}:${this.INSTANCE_SPLASH_PORT}`;
    this.EXTERNAL_SPLASH_BASEPATH = `http://${this.CLUSTER_SPLASH_EXTERNAL_IP}:${this.INSTANCE_SPLASH_PORT}`;
    this.SPLASH_SCREENSHOT_TIMEOUT = SPLASH_SCREENSHOT_TIMEOUT;
    this.MAX_SPLASH_SCREENSHOT_WIDTH = MAX_SPLASH_SCREENSHOT_WIDTH;

    this.awsS3Service = awsS3Service;
  }

  // async setupLocalPuppeteer() {
  // }

  async makeScreenshot(externalContext) {
    const {
      params: { tool }
    } = externalContext;

    const { cloud, puppeteerCluster, splash, puppeteerLocal } = TOOLS_FOR_CREATE_EMBED;

    switch (tool) {
      case cloud:
        await this.makePuppeteerCloudScreenshot(externalContext);
        break;
      case puppeteerCluster:
        await this.makePuppeteerClusterScreenshot(externalContext);
        break;
      case splash:
        await this.makeSplashClusterScreenshot(externalContext);
        break;
      case puppeteerLocal:
        await this.makePuppeteerLocalScreenshot(externalContext);
        break;
      default:
        await this.makePuppeteerClusterScreenshot(externalContext);
    }

    return;
  }

  async makePuppeteerLocalScreenshot(externalContext) {
    try {
      const contextSocial = _.defaultsDeep(
        {
          params: { screenshot: 'shared' }
        },
        externalContext
      );
      const contextDownload = _.defaultsDeep(
        {
          params: { screenshot: 'download' }
        },
        externalContext
      );

      await Promise.all([
        this.createPuppeteerScreenshot(contextSocial),
        this.createPuppeteerScreenshot(contextDownload)
      ]);

      return;
    } catch (err) {
      throw err;
    }
  }

  async makePuppeteerCloudScreenshot(externalContext) {
    const { metadata, embedUrl, embedId, placesCount } = externalContext;
    const decodedUrl = encodeURIComponent(embedUrl);

    try {
      const options: request.Options = {
        uri: `https://europe-west1-dev-puppeteer.cloudfunctions.net/${this.NODE_ENV}-puppeteer-${this.MODE_ENV}`,
        body: {
          metadata,
          embedUrl: decodedUrl,
          embedId,
          placesCount
        },
        json: true
      };

      const result = await request
        .post(options)
        .then((body) => {
          return JSON.parse(body);
        })
        .catch((error) => {
          console.error(error);

          throw new Error(EMBED_ERRORS.TOO_MANY_CONNECTIONS);
        });

      // const result = await request(options);
      const { success } = result;
      if (success !== true) {
        console.error('Unsuccessfull result: ', result);
        throw new Error(EMBED_ERRORS.TOO_MANY_CONNECTIONS);
      }

      return;
    } catch (error) {
      throw error;
    }
  }

  async makePuppeteerClusterScreenshot(externalContext) {
    const {
      metadata,
      embedUrl,
      embedId,
      placesCount,
      params: { requestUuid }
    } = externalContext;
    const decodedUrl = encodeURIComponent(embedUrl);
    const urlToCluster = `http://${this.CLUSTER_PUPPETEER_EXTERNAL_IP}:${this.CLUSTER_PUPPETEER_EXTERNAL_PORT}/embed`;

    try {
      const options: request.Options = {
        uri: urlToCluster,
        timeout: 30000,
        body: {
          metadata,
          embedUrl: decodedUrl,
          embedId,
          placesCount,
          requestUuid
        },
        json: true
      };

      console.log('CLUSTER_PUPPETEER_POST_REQUEST: ', JSON.stringify(options, null, '\t'));
      console.time(`puppeteer.request.${requestUuid}`);
      let limitAttempts = 3;

      while (limitAttempts) {
        await request
          .post(options)
          .then((result) => {
            const { success } = result;

            if (success !== true) {
              console.error('Next attempt after unsuccessfull result: ', result);
              throw new Error(EMBED_ERRORS.TOO_MANY_CONNECTIONS);
              // throw new Error(EMBED_ERRORS.PUPPETEER_CLUSTER_NOT_WORK);
            }

            limitAttempts = 0;
          })
          .catch(async (error) => {
            console.error('Next attempt after error: ', error.message, error);

            limitAttempts--;

            if (!limitAttempts) {
              throw new Error(EMBED_ERRORS.TOO_MANY_CONNECTIONS);
            }

            return new Promise((resolve) => setTimeout(resolve, 1000));
          });
      }

      console.timeEnd(`puppeteer.request.${requestUuid}`);

      return;
    } catch (error) {
      throw error;
    }
  }

  async makeSplashClusterScreenshot(externalContext) {
    const contextSocial = _.defaultsDeep(
      {
        params: {
          screenshot: 'shared',
          tool: 'splash'
        }
      },
      DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT,
      externalContext
    );
    const contextDownload = _.defaultsDeep(
      {
        params: {
          screenshot: 'download',
          tool: 'splash'
        }
      },
      DEFAULT_DOWNLOAD_SCREENSHOT_VIEWPORT,
      externalContext
    );

    await Promise.all([this.createSplashScreenshot(contextSocial), this.createSplashScreenshot(contextDownload)]);

    return;
  }

  getEmbedUrl(embedId: string, params: EmbedParams) {
    const { referer: fullURL } = params;
    const parseUrl = url.parse(fullURL, true);
    parseUrl.query = _.omit(parseUrl.query, EMBED_REMOVE_PARAMS);

    if (embedId) {
      parseUrl.query.embed = embedId;
    }

    parseUrl.search = `?${queryString.stringify(parseUrl.query)}`;

    const embedUrl = url.format(parseUrl);
    const S3_EMBED_FOLDER_PATH = this.awsS3Service.S3_EMBED_FOLDER_PATH;
    const imageUrl = this.awsS3Service.getImageUrl(`embed_${embedId}`, S3_EMBED_FOLDER_PATH);
    const downloadUrl = this.awsS3Service.getImageUrl(`embed_download_${embedId}`, S3_EMBED_FOLDER_PATH);
    const result = { embedUrl, imageUrl, downloadUrl };

    console.log('getEmbedUrl', JSON.stringify(result));

    return result;
  }

  private async createPuppeteerScreenshot(externalContext) {
    const {
      placesCount,
      params: { screenshot },
      requestUuid,
      metadata,
      embedId
    } = externalContext;

    let browser: puppeteer.Browser;

    try {
      console.time(`${screenshot}.puppeteer.${requestUuid}`);

      console.time(`${screenshot}.targetUrl.${requestUuid}`);
      const targetUrl = this.getTargetUrl(externalContext);

      console.log(targetUrl);
      const downloadImageWidth = placesCount * DOWNLOAD_IMAGE.imageSize + DOWNLOAD_IMAGE.padding;

      const DEFAULT_SCREENSHOT_VIEWPORT = {
        width: downloadImageWidth,
        height: downloadImageWidth
      };
      console.timeEnd(`${screenshot}.targetUrl.${requestUuid}`);

      console.time(`${screenshot}.browser.${requestUuid}`);
      browser = await puppeteer.launch({
        timeout: 30000,
        // headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', targetUrl],
        pipe: true
      });
      console.timeEnd(`${screenshot}.browser.${requestUuid}`);

      console.time(`${screenshot}.page.${requestUuid}`);
      const [page] = await browser.pages();
      console.timeEnd(`${screenshot}.page.${requestUuid}`);

      console.time(`${screenshot}.viewport.${requestUuid}`);
      const SCREENSHOT_VIEWPORT =
        screenshot === 'download' ? DEFAULT_SCREENSHOT_VIEWPORT : DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT;
      await page.setViewport(SCREENSHOT_VIEWPORT);
      console.timeEnd(`${screenshot}.viewport.${requestUuid}`);

      console.time(`${screenshot}.waitFor.${requestUuid}`);
      await page.waitFor(DEFAULT_EMBED_PREVIEW_CONTAINER, { visible: true });
      await page.waitFor('loader', { hidden: true });
      await page.waitFor(EMBED_TITLE_CONTAINER, { visible: true });
      console.timeEnd(`${screenshot}.waitForLoader.${requestUuid}`);

      // create image for preview
      console.time(`${screenshot}.container.${requestUuid}`);
      const embedContainer = await page.$(DEFAULT_EMBED_PREVIEW_CONTAINER);
      console.timeEnd(`${screenshot}.container.${requestUuid}`);

      console.time(`${screenshot}.screenshot.${requestUuid}`);
      const imageBuffer = await embedContainer.screenshot({ type: 'jpeg' });
      console.timeEnd(`${screenshot}.screenshot.${requestUuid}`);

      console.time(`${screenshot}.close.${requestUuid}`);
      // tslint:disable-next-line:no-floating-promises
      browser.close();
      console.timeEnd(`${screenshot}.close.${requestUuid}`);

      console.timeEnd(`${screenshot}.puppeteer.${requestUuid}`);

      console.time(`${screenshot}.aws.${requestUuid}`);
      await this.awsS3Service.uploadBufferToS3({
        folderpath: this.awsS3Service.S3_EMBED_FOLDER_PATH,
        contentType: 'image/jpeg',
        filename: `embed_${screenshot === 'download' ? 'download_' : ''}${embedId}.jpeg`,
        image: imageBuffer,
        requestUuid,
        metadata
      });
      console.timeEnd(`${screenshot}.aws.${requestUuid}`);

      return;
    } catch (err) {
      if (browser) {
        await browser.close();
      }

      throw err;
    }
  }

  private async createSplashScreenshot(externalContext): Promise<void> {
    const {
      width,
      height,
      embedId,
      metadata,
      requestUuid,
      params: { screenshot }
    } = externalContext;

    const targetUrl = this.getTargetUrl(externalContext);
    const splashWidth = width > this.MAX_SPLASH_SCREENSHOT_WIDTH ? this.MAX_SPLASH_SCREENSHOT_WIDTH : width;
    const query = {
      url: targetUrl,
      viewport: `${splashWidth}x${height}`,
      wait: this.SPLASH_WAIT_FOR_IMAGE,
      images: 1,
      expand: 1,
      timeout: this.SPLASH_SCREENSHOT_TIMEOUT,
      quality: 95,
      width: splashWidth,
      height
    };
    const internalUrl = `${this.INTERNAL_SPLASH_BASEPATH}/render.jpeg?${queryString.stringify(query)}`;
    const externalUrl = `${this.EXTERNAL_SPLASH_BASEPATH}/render.jpeg?${queryString.stringify(query)}`;
    console.log('INTERNAL:', internalUrl);
    console.log('EXTERNAL:', externalUrl);

    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      http
        .get(externalUrl, (res) => {
          let imageData = Buffer.alloc(0);
          res.on('data', (chunk: Buffer) => {
            imageData = Buffer.concat([imageData, chunk]);
          });
          res.on('end', () => {
            return resolve(imageData);
          });
        })
        .on('error', (err) => {
          return reject(err);
        });
    });

    console.time(`${screenshot}.aws.${requestUuid}`);
    await this.awsS3Service.uploadBufferToS3({
      folderpath: this.awsS3Service.S3_EMBED_FOLDER_PATH,
      contentType: 'image/jpeg',
      filename: `embed_${screenshot === 'download' ? 'download_' : ''}${embedId}.jpeg`,
      image: imageBuffer,
      requestUuid,
      metadata
    });
    console.timeEnd(`${screenshot}.aws.${requestUuid}`);

    return;
  }

  // tslint:disable-next-line:prefer-function-over-method
  private getTargetUrl(externalContext) {
    const {
      embedUrl,
      placesCount,
      params: { tool, screenshot }
    } = externalContext;

    const parsedTargetHost = url.parse(embedUrl, true);
    Object.assign(parsedTargetHost.query, {
      screenshot,
      tool,
      placesCount
    });
    parsedTargetHost.search = `?${queryString.stringify(parsedTargetHost.query)}`;
    const targetUrl = url.format(parsedTargetHost);

    console.log(embedUrl, targetUrl, encodeURIComponent(targetUrl));

    return targetUrl;
  }
}
