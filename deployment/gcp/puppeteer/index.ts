import * as AWS from 'aws-sdk';
import * as puppeteer from 'puppeteer';
import * as path from 'path';

const DEFAULT_SHARE_SCREENSHOT_VIEWPORT = {
  width: 1200,
  height: 627
};
const DOWNLOAD_IMAGE = {
  padding: 34,
  imageSize: 490
};

AWS.config.update({
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
// const INDEX_HTML_PATH = process.env.NODE_ENV === 'local' ? path.join(__dirname, 'index.html') : 'index.html';

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export async function createImage(req, res) {
  const params = {...req.query, ...req.body};
  console.log(JSON.stringify(params));

  //TODO use common module for upload credentials
  const { embedId, imageLenght, baseUrl, s3Bucket } = (params as {embedId: string; imageLenght: number; baseUrl: string; s3Bucket: string});
  const BASE_FUNCTION_URL = baseUrl || process.env.BASE_FUNCTION_URL;
  const S3_BUCKET = s3Bucket || process.env.S3_BUCKET;
  // const PAGE_LINK = `file:${INDEX_HTML_PATH}` || `${BASE_URL}/matrix?embed=${embedId}&puppeteer=true`;
  const PAGE_LINK = `${BASE_FUNCTION_URL}/matrix?embed=${embedId}&puppeteer=true`;

  const QUERY = {s3Bucket: S3_BUCKET, baseUrl: BASE_FUNCTION_URL, pageLink: PAGE_LINK, ...params};

  console.log(JSON.stringify(params));

  let browser;

  try {
    console.time('puppeteer');

    console.time('browser');
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', `${PAGE_LINK}`], pipe: true });
    console.timeEnd('browser');

    console.time('page');
    const [page] = await browser.pages();
    console.timeEnd('page');

    // console.time('waitFor');
    // page.waitFor('#embed-preview-container');
    // console.timeEnd('waitFor');
    // console.time('goto');
    // await page.goto(PAGE_LINK, { waitUntil: 'networkidle2', timeout: 90000 });
    // console.timeEnd('goto');

    console.time('load');
    await new Promise((resolve) => page.once('load', () => {console.log('Page loaded!'); resolve()}));
    // await new Promise((resolve) => page.once('domcontentloaded', () => {console.log('Page loaded!'); resolve()}));
    // page.once('load', () => console.log('Page loaded!'));
    console.timeEnd('load');

    console.time('embedContainer');
    const embedContainer = await page.$('#embed-preview-container');
    console.timeEnd('embedContainer');

    // create image for download
    const downloadImageWidth = imageLenght * DOWNLOAD_IMAGE.imageSize + DOWNLOAD_IMAGE.padding;
    const viewport = {
      width: downloadImageWidth,
      height: downloadImageWidth
    };
    console.log(viewport);
    page.setViewport(viewport);

    console.time('evaluate1');
    await page.evaluate(() => {
      const container = document.querySelector('#embed-preview-container');
      const places = container.querySelectorAll('.pin-place');

      container.classList.add('for-download', `places-lenght-${places.length}`);
      window.dispatchEvent(new Event('resize'));
    });
    console.timeEnd('evaluate1');

    await page.waitFor(100);
    console.time('screenshot');
    const downloadImageBuffer = await embedContainer.screenshot({type: 'jpeg'});
    console.timeEnd('screenshot');

    // create image for preview
    page.setViewport(DEFAULT_SHARE_SCREENSHOT_VIEWPORT);

    console.time('evaluate2');
    await page.evaluate(() => {
      const container = document.querySelector('#embed-preview-container');
      container.classList.add('for-screenshot');
      window.dispatchEvent(new Event('resize'));
    });
    console.timeEnd('evaluate2');

    await page.waitFor(100);
    console.time('screenshot2');
    const shareImageBuffer = await embedContainer.screenshot({type: 'jpeg'});
    console.timeEnd('screenshot2');
    console.timeEnd('puppeteer');

    console.time('aws');
    uploadBufferToS3(shareImageBuffer, S3_BUCKET, `shared/embed_${embedId}.jpeg`, 'image/jpeg');
    uploadBufferToS3(downloadImageBuffer, S3_BUCKET, `shared/embed_download_${embedId}.jpeg`, 'image/jpeg');
    console.timeEnd('aws');

    return res.json({success: true, query: QUERY});
  } catch (error) {
    console.error(error);

    return res.status(500).json({success: false, query: QUERY, error});
  }
};

async function calculateViewportForShareScreenshot(page) {
  const aspectRatio = 1.91;
  const imageHeight = await page.evaluate((sel) => {
    return document.querySelector(sel).clientHeight;
  }, '#embed-preview-container');

  return imageHeight && imageHeight > DEFAULT_SHARE_SCREENSHOT_VIEWPORT.height
    ? {
      width: Math.round(imageHeight * aspectRatio),
      height: imageHeight
    }
    : DEFAULT_SHARE_SCREENSHOT_VIEWPORT;
}

async function uploadBufferToS3(buffer, bucket, name, type) {
  const params = {
    Bucket: bucket,
    Key: name,
    ContentType: type,
    Body: buffer,
    ACL: 'public-read',
    CacheControl: 'max-age=2628000'
  };

  return new Promise((resolve, reject) => {
    s3.putObject(params, (error, data) => {
      return error ? reject(error) : resolve();
    });
  });
}
