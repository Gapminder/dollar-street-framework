import { browser, protractor } from 'protractor';
import * as request from 'request';
import { getRandomNumber, isInViewport, waitForVisible } from '../../helpers';
import { CountryPage, FamilyPage, MatrixPage } from '../../pages';
import { FamilyImage, FamilyImagePreview, Header, MatrixImagePreview, WelcomeWizard } from '../../pages/components';
import { scrollIntoView } from '../../helpers/common-helper';

const pattern = /^.*(\/)/; // grab everything to last slash
const baseApiUrl = browser.params.apiUrl;
let random: number;
let family: FamilyImage;

describe('Matrix Page: Image Preview:', () => {
  const NUMBER_OF_LINKS_TO_TEST = 4;

  beforeEach(async () => {
    random = getRandomNumber();

    await browser.get(MatrixPage.url);
    await WelcomeWizard.disableWizard();
    family = MatrixPage.getFamily(random);
  });

  for (let i = 0; i < NUMBER_OF_LINKS_TO_TEST; i++) {
    it(`Image preview section is displayed for image ${i}`, async () => {
      family = MatrixPage.getFamily(getRandomNumber());

      const familyImagePreview: MatrixImagePreview = await family.openPreview();

      try {
        await waitForVisible(familyImagePreview.rootSelector);
        expect(await familyImagePreview.isDisplayed()).toBeTruthy();
      } catch (err) {
        if (err.name === 'NoSuchElementError') {
          throw new Error(`FamilyImagePreview is not present on the page!\n${err}`);
        }
      }
      expect(await isInViewport(familyImagePreview.rootSelector)).toBeTruthy('imagePreview not in the viewport');

      /**
       * check that country name match in preview and description
       */
      const familyCountry = await family.getCountryName();
      const countryInDescription = await familyImagePreview.familyName.getText();

      expect(countryInDescription).toContain(familyCountry);
    });
  }

  for (let i = 0; i < NUMBER_OF_LINKS_TO_TEST; i++) {
    it(`Open image preview and check image src for ${i} image`, async () => {
      /**
       * click on image in matrix page should open preview for that image
       * loop is needed to check specific issue when image doesn't update
       * second time
       */
      const familyImageSrc = await family.getImageSrc();
      const previewSrc = await (await family.openPreview()).getImageSrc();

      expect(familyImageSrc).toEqual(previewSrc);
    });
  }

  for (let i = 0; i < NUMBER_OF_LINKS_TO_TEST; i++) {
    it(`Store state in URL for ${i} image`, async () => {
      /**
       * click on image and switching between images should store activeHouse in url
       */
      const urlBefore = await browser.getCurrentUrl();

      await MatrixPage.getFamily(random).openPreview();

      const urlAfter = await browser.getCurrentUrl();

      expect(urlBefore).not.toEqual(urlAfter);
      expect(urlAfter).toContain(`activeHouse=${random + 1}`);
    });
  }

  it('imagePreview scrolled into view when opens', async () => {
    const FIRST_FAMILY = 2;
    const SECOND_FAMILY = 9;
    let imagePreview: MatrixImagePreview;

    const firstImage = MatrixPage.getFamily(FIRST_FAMILY);
    imagePreview = await firstImage.openPreview();
    expect(await imagePreview.isInViewport()).toBeTruthy('First ImagePreview should be visible');

    const secondImage = MatrixPage.getFamily(SECOND_FAMILY);
    imagePreview = await secondImage.openPreview();
    expect(await imagePreview.isInViewport()).toBeTruthy('Second ImagePreview should be visible');
  });

  it('close selected image by click on it', async () => {
    await family.click();
    await scrollIntoView(family.rootSelector);
    await family.click();

    expect(await new MatrixImagePreview().isPresent()).toBeFalsy('Image preview should not exist');
    expect(await browser.getCurrentUrl()).not.toContain(`activeHouse`);
  });

  it('close selected image by click on "X" icon', async () => {
    const familyImagePreview: FamilyImagePreview = await family.openPreview();
    await familyImagePreview.close();

    expect(await familyImagePreview.isPresent()).toBeFalsy('Image preview should not exist');
  });

  it('open fullSize preview by click on image', async () => {
    // check images src to make sure that correct image has been opened
    const familyImageSrc = await family.getImageSrc();

    const familyImagePreview = await family.openPreview();
    const linkToSelectedPlace = await familyImagePreview.visitThisHomeBtn.getAttribute('href');
    const placeId = linkToSelectedPlace.split('place=')[1];
    await familyImagePreview.openFullSizePreview('matrix');

    const url = `${baseApiUrl}/matrix-view-block/?placeId=${placeId}&thingId=Families`;
    const getDataFromRemoteServerPromise = (urlString) => {
      return new Promise((resolve, reject) => {
        request.get(urlString, (err, res, body) => {
          if (err) {
            return reject(err);
          }

          return resolve(JSON.parse(body));
        });
      });
    };
    const {
      data: { familyImage }
    } = (await getDataFromRemoteServerPromise(url)) as any;

    expect(await familyImagePreview.fullSizeImage.isDisplayed()).toBeTruthy('FullSize image should be displayed');
    expect((familyImage as any).url).toContain(decodeURIComponent(familyImageSrc.split('//')[1]));
  });

  it('fullSize preview closed on Esc button action', async () => {
    const familyImagePreview = await family.openPreview();
    await familyImagePreview.openFullSizePreview('matrix');
    await browser
      .actions()
      .sendKeys(protractor.Key.ESCAPE)
      .perform();

    expect(await familyImagePreview.fullSizeImage.isPresent()).toBeFalsy('FullSize image should be displayed');
  });

  it('"Visit this home" button leads to family page', async () => {
    const familyImagePreview = await family.openPreview();
    const previewImageSrc = await familyImagePreview.getImageSrc();
    const placeId = await familyImagePreview.getPlaceId();

    await familyImagePreview.visitThisHomeBtn.click();

    const familyPhotoSrc = (await FamilyPage.familyPhoto.getAttribute('src')).match(pattern)[0]; // TODO refactor this

    await expect(previewImageSrc).toEqual(familyPhotoSrc);
    expect(await browser.getCurrentUrl()).toContain('family?');
    expect(await browser.getCurrentUrl()).toContain(`place=${placeId}`);
  });

  it('"All families" button activate filter by country', async () => {
    const countryName = await family.getCountryName();
    const familyImagePreview = await family.openPreview();
    await familyImagePreview.allFamiliesBtn.click();

    expect(await MatrixPage.filterByCountry.getText()).toEqual(countryName);
    // check that all displayed families have chosen country
    for (const imageIndex of (await MatrixPage.countryInImageDescription.asElementFinders_()).keys()) {
      const currentImage = MatrixPage.getFamily(Number(imageIndex));
      const actualCountryName = await currentImage.getCountryName();

      expect(actualCountryName).toEqual(countryName);
    }
  });

  it('Click on minimap leads to country page', async () => {
    const countryName = await family.getCountryName();
    const familyImagePreview = await family.openPreview();
    await familyImagePreview.miniMap.click();

    expect(await browser.getCurrentUrl()).toContain('country');
    expect(await Header.headerTitle.getText()).toEqual(countryName);
  });

  it('Photographer name leads to photographer page', async () => {
    const familyImagePreview = await family.openPreview();
    const photographerName = await familyImagePreview.photographerName.getText();

    await scrollIntoView(familyImagePreview.photographerName);
    await familyImagePreview.photographerName.click();

    expect(await browser.getCurrentUrl()).toContain('photographer');
    expect(await Header.headerTitle.getText()).toContain(photographerName); // refactor: move this into header
  });
});
