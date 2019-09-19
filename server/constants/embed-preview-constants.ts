const DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT = {
  width: 1200,
  height: 627
};

const DEFAULT_DOWNLOAD_SCREENSHOT_VIEWPORT = {
  width: 1200,
  height: 830
};

const DOWNLOAD_IMAGE = {
  padding: 34,
  imageSize: 490
};

const MAX_SPLASH_SCREENSHOT_WIDTH = 1920;
// tslint:disable-next-line:number-literal-format
const SPLASH_SCREENSHOT_TIMEOUT = 90.0;

const DEFAULT_EMBED_PREVIEW_CONTAINER = '#embed-preview-container';
const EMBED_TITLE_CONTAINER = '#embed-title';
const DEFAULT_SPLASH_WAIT_FOR_IMAGE = 10;
const RESPONSE_200_STATUS_CODE = 200;
const PUPPETEER_PAGE_TIMEOUT = 300;
const EMBED_ERROR_CODE = 314;
const DEFAULT_SCREENSHOOT_TOOL = 'splash';
const SIZE_OF_EMPTY_IMAGE = 20000;
const BOT_CHECHER_REGEX = /twitterbot|google|linkedin|facebo|bot/i;
const EMBED_REMOVE_PARAMS = ['activeHouse', 'row'];
const TOOLS_FOR_CREATE_EMBED = {
  cloud: 'cloud',
  puppeteerCluster: 'puppeteer',
  splash: 'splash',
  puppeteerLocal: 'local'
};
const EMBED_ERRORS = {
  NO_LONGER_AVAILABLE: 'The comparison for this pictures is not longer available',
  IS_INVALID: `Embed is invalid`,
  NOT_FOUND: `Embed was not found`,
  REFERER_NOT_FOUND: `Referer were not found`,
  THING_NOT_FOUND: `Thing was not found`,
  THING_IS_INVALID: `Thing is invalid`,
  MEDIAS_NOT_FOUND: `Medias were not found`,
  MEDIAS_ARE_INVALID: `Medias are invalid`,
  THING_IS_EMPTY: `Thing is empty`,
  PLACES_ARE_EMPTY: `Places are empty`,
  PLACES_ARE_INVALID: `Places are invalid`,
  COUNTRIES_ARE_EMPTY: `Countries are empty`,
  COUNTRIES_ARE_INVALID: `Countries are invalid`,
  NO_EMBED_NO_FILE: 'No requested embed or file',
  PUPPETEER_CLUSTER_NOT_WORK: 'Puppeteer Cluster doesnt work',
  TOO_MANY_CONNECTIONS: 'There are many people trying to create comparisons right now. Please try again later'
};

export {
  DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT,
  DEFAULT_DOWNLOAD_SCREENSHOT_VIEWPORT,
  DEFAULT_EMBED_PREVIEW_CONTAINER,
  DOWNLOAD_IMAGE,
  PUPPETEER_PAGE_TIMEOUT,
  RESPONSE_200_STATUS_CODE,
  DEFAULT_SPLASH_WAIT_FOR_IMAGE,
  EMBED_ERROR_CODE,
  DEFAULT_SCREENSHOOT_TOOL,
  SIZE_OF_EMPTY_IMAGE,
  BOT_CHECHER_REGEX,
  EMBED_REMOVE_PARAMS,
  MAX_SPLASH_SCREENSHOT_WIDTH,
  SPLASH_SCREENSHOT_TIMEOUT,
  TOOLS_FOR_CREATE_EMBED,
  EMBED_ERRORS,
  EMBED_TITLE_CONTAINER
};
