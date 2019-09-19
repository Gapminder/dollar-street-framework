// Todo: Need refactor according to "noImplicitAny" rule

import { embedRepositoryService } from '../../repositories/embed.repository.service';
import { Embed, EmbedDTO, EmbedQuery } from '../../interfaces/embed';
import { ScreenshotService } from './screenshot.service';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { AwsS3Service } from './aws-s3.service';
import { EmbedMedia, Media } from '../../interfaces/media';
import { PlaceEntity, ProjectedEmbedPlace } from '../../interfaces/places';
import { Locations } from '../../interfaces/locations';
import { EmbedParams } from '../../interfaces/puppeteer.interfaces';
import { Things } from '../../interfaces/things';
import { EMBED_ERRORS } from '../../../constants/embed-preview-constants';
import { LocationTranslation } from '../../../../cms/server/src/.controllers/locations.interface';

export class EmbedService {
  readonly NODE_ENV: string;
  readonly DEFAULT_VALID_THING_LIST_VALUE = 'white';
  readonly DEFAULT_VALID_PLACE_LIST_VALUE = 'white';
  readonly DEFAULT_LEGACY_VALID_MEDIA_THING_HIDDEN_VALUE = 'show';
  readonly DEFAULT_VALID_MEDIA_THING_HIDDEN_VALUE = 'false';
  readonly MIN_PLACES_EMBED = 2;
  readonly MAX_PLACES_EMBED = 6;
  readonly IMAGE_PARAMS_FOR_CREATE_EMBED = ['shared', 'download'];

  private readonly screenshotService: ScreenshotService;
  private readonly awsS3Service: AwsS3Service;

  constructor(nconf, screenshotService: ScreenshotService, awsS3Service: AwsS3Service) {
    this.NODE_ENV = nconf.get('NODE_ENV');

    this.screenshotService = screenshotService;
    this.awsS3Service = awsS3Service;
  }

  validateCommonParams(params: EmbedParams) {
    const { referer } = params;

    if (_.isEmpty(referer)) {
      console.log(new Error(EMBED_ERRORS.REFERER_NOT_FOUND));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }
  }

  validateGettingParams(params: EmbedParams) {
    this.validateCommonParams(params);

    const { embed } = params;

    if (_.isEmpty(embed)) {
      console.log(new Error(EMBED_ERRORS.NOT_FOUND));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (!mongoose.Types.ObjectId.isValid(embed)) {
      console.log(new Error(EMBED_ERRORS.IS_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }
  }

  validateCreationParams(params: EmbedParams) {
    this.validateCommonParams(params);

    const { embed, mediasIds, thingId } = params;

    if (!_.isEmpty(embed) && !mongoose.Types.ObjectId.isValid(thingId)) {
      console.log(new Error(EMBED_ERRORS.IS_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (_.isEmpty(thingId)) {
      console.log(new Error(EMBED_ERRORS.THING_NOT_FOUND));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (!mongoose.Types.ObjectId.isValid(thingId)) {
      console.log(new Error(EMBED_ERRORS.THING_IS_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (_.isEmpty(mediasIds)) {
      console.log(new Error(EMBED_ERRORS.MEDIAS_NOT_FOUND));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (!_.every(mediasIds, (mediaId) => mongoose.Types.ObjectId.isValid(mediaId))) {
      console.log(new Error(EMBED_ERRORS.MEDIAS_NOT_FOUND));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }
  }

  isEmbedLegal(embed: EmbedDTO) {
    const thing = _.get(embed, 'thing', null);
    const medias = _.get(embed, 'medias', null);
    const places = _.map(medias, 'place');
    const countries = _.map(places, 'country');

    if (_.isEmpty(thing)) {
      console.log(new Error(EMBED_ERRORS.THING_IS_EMPTY));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (thing.list !== this.DEFAULT_VALID_THING_LIST_VALUE) {
      console.log(new Error(EMBED_ERRORS.THING_IS_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (
      _.isEmpty(medias) &&
      medias.length > this.MAX_PLACES_EMBED &&
      medias.length < this.MIN_PLACES_EMBED &&
      _.uniq(medias).length !== medias.length
    ) {
      console.log(new Error(EMBED_ERRORS.MEDIAS_ARE_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    const thingId = thing._id.toString();
    const isMediasValid = _.every(medias, (media: Media) => {
      const mediaThing: {
        _id: string | Things;
        rating: number;
        tags: { text: string }[];
        hidden: string;
      } = _.find(media.things, (_thing) => _thing._id.toString() === thingId);

      const mediaThingHidden: string | boolean = _.get(
        mediaThing,
        'hidden',
        this.DEFAULT_VALID_MEDIA_THING_HIDDEN_VALUE
      );

      const doesMediaThingShow =
        mediaThingHidden === this.DEFAULT_LEGACY_VALID_MEDIA_THING_HIDDEN_VALUE ||
        mediaThingHidden === this.DEFAULT_VALID_MEDIA_THING_HIDDEN_VALUE;

      return media && !media.isTrash && media.isApproved && !_.isEmpty(mediaThing) && doesMediaThingShow;
    });

    if (!isMediasValid) {
      console.log(new Error(EMBED_ERRORS.MEDIAS_ARE_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (_.isEmpty(places)) {
      console.log(new Error(EMBED_ERRORS.PLACES_ARE_EMPTY));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    const isPlacesValid = _.every(places, (place: PlaceEntity) => {
      return place && !place.isTrash && (place.list === this.DEFAULT_VALID_PLACE_LIST_VALUE || place.isPublic);
    });

    if (!isPlacesValid) {
      console.log(new Error(EMBED_ERRORS.PLACES_ARE_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    if (_.isEmpty(countries)) {
      console.log(new Error(EMBED_ERRORS.COUNTRIES_ARE_EMPTY));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }

    const isCountriesValid = _.every(countries, (country: Locations) => country.alias || country.country);

    if (!isCountriesValid) {
      console.log(new Error(EMBED_ERRORS.COUNTRIES_ARE_INVALID));

      throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
    }
  }

  async isEmbedActual(embed: EmbedDTO, currentDate: number) {
    const thing = _.get(embed, 'thing', null);
    const medias = _.get(embed, 'medias', null);
    const places = _.map(medias, 'place');
    const countries = _.map(places, 'country');

    const embedVersion = _.get(embed, 'updatedAt', 0).valueOf();
    const thingVersion = _.get(thing, 'updatedAt', currentDate).valueOf();

    if (embedVersion <= thingVersion) {
      return false;
    }

    if (!this.isAllVersionsValid(medias as { updatedAt: object }[], embedVersion, currentDate)) {
      return false;
    }

    if (!this.isAllVersionsValid(places as { updatedAt: object }[], embedVersion, currentDate)) {
      return false;
    }

    if (!this.isAllVersionsValid(countries as { updatedAt: object }[], embedVersion, currentDate)) {
      return false;
    }

    return true;
  }

  async newComparison(params: EmbedParams) {
    this.validateCreationParams(params);

    const query: EmbedQuery = {
      medias: params.mediasIds,
      thing: params.thingId,
      lang: params.lang,
      env: this.NODE_ENV,
      resolution: params.resolution,
      version: this.awsS3Service.S3_EMBED_VERSION
    };

    if (params.embed) {
      Object.assign(query, { _id: params.embed });
    }

    const embed = await embedRepositoryService.upsertEmbed(query);
    this.isEmbedLegal(embed);

    const context = { embed, params };
    const newContext = await this.actualizeEmbedAndS3(context);

    return newContext;
  }

  async openComparison(params: EmbedParams) {
    try {
      this.validateGettingParams(params);

      const query: object = {
        _id: params.embed,
        env: this.NODE_ENV,
        version: this.awsS3Service.S3_EMBED_VERSION
      };

      let embed: EmbedDTO = await embedRepositoryService.findEmbed(query);
      let fileMetadata = null;

      if (_.isEmpty(embed)) {
        const embedId = params.embed;
        const folderpath = this.awsS3Service.S3_EMBED_FOLDER_PATH;
        const filename = `embed_${embedId}.jpeg`;

        fileMetadata = await this.awsS3Service.getMetadataFromS3File({ folderpath, filename });

        if (_.isEmpty(fileMetadata)) {
          console.log(new Error(EMBED_ERRORS.NO_EMBED_NO_FILE));

          throw new Error(EMBED_ERRORS.NO_LONGER_AVAILABLE);
        }

        const newEmbed = this.decodeMetadata(fileMetadata);
        embed = await embedRepositoryService.createEmbed(newEmbed);
      }

      this.isEmbedLegal(embed);

      const makesScreenshotOfNewEmbed = _.includes(this.IMAGE_PARAMS_FOR_CREATE_EMBED, params.screenshot);

      if (!makesScreenshotOfNewEmbed) {
        const context = { fileMetadata, embed, params, embedId: embed._id.toString() };
        await this.actualizeEmbedAndS3(context);
      }

      return this.projectEmbedPlaces(embed);
    } catch (error) {
      throw error;
    }
  }

  async actualizeEmbedAndS3(externalContext) {
    const { embed, params } = externalContext;
    const embedId = embed._id.toString();

    const embedMetadata = this.createMetadata(embed);
    const context = Object.assign(
      {
        params,
        embed,
        embedId,
        placesCount: embed.medias.length,
        metadata: embedMetadata
      },
      this.screenshotService.getEmbedUrl(embedId, params)
    );
    let fileMetadata = _.get(externalContext, 'fileMetadata', null);

    const currentDate = Date.now();

    if (!this.isEmbedActual(embed, currentDate)) {
      await this.screenshotService.makeScreenshot(context);
      await embedRepositoryService.updateEmbedById(context.embedId, embed.env);

      return context;
    }

    if (_.isEmpty(fileMetadata)) {
      const folderpath = this.awsS3Service.S3_EMBED_FOLDER_PATH;
      const filename = `embed_${context.embedId}.jpeg`;

      fileMetadata = await this.awsS3Service.getMetadataFromS3File({ folderpath, filename });
    }
    const isFileActual = _.isEqual(fileMetadata, embedMetadata);

    if (!isFileActual) {
      // ts-lint:disable-next-line:no-floating-promises
      await this.screenshotService.makeScreenshot(context);
    }

    return context;
  }

  projectEmbedPlaces(embed: Embed): ProjectedEmbedPlace[] {
    const embedPlaces = _.map(
      embed.medias,
      (media: EmbedMedia): ProjectedEmbedPlace => {
        const defaultRegionName: string = _.get(media, 'place.country.region.name', '');
        const defaultCountryName: string = _.get(media, 'place.country.alias', '');
        const filename = `${this.screenshotService.DEFAULT_RESOLUTION}-${media.amazonfilename}`;
        const defaultBackground = `${this.awsS3Service.S3_SERVER}${media.src}${filename}`;

        const background: string = _.get(media, 'background', defaultBackground).toString();
        const countryTranslations: LocationTranslation[] = _.get(media, 'place.country.translations', null);
        const country: LocationTranslation = _.find(countryTranslations, { lang: embed.lang });

        return {
          background,
          showBackground: background,
          country: country ? country.alias : defaultCountryName,
          image: _.get(media, '_id', '').toString(),
          income: _.get(media, 'place.income', 0),
          incomeQuality: _.get(media, 'place.incomeQuality', 0),
          region: defaultRegionName,
          lat: _.get(media, 'place.country.lat', 0),
          lng: _.get(media, 'place.country.lng', 0),
          _id: _.get(media, 'place._id', '')
        };
      }
    );

    // const embedPlacesIds = _.map(placesSet, (place) => mongoose.Types.ObjectId(_.get(place, '_id', '')));

    return _.sortBy(embedPlaces, ['income']);
  }

  decodeMetadata(metadata) {
    try {
      return {
        _id: metadata._id,
        thing: metadata.thing_id,
        medias: JSON.parse(decodeURIComponent(metadata.medias_ids)),
        env: metadata.env,
        lang: metadata.lang,
        currentId: metadata._id,
        version: metadata.version,
        resolution: metadata.resolution
      };
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  createMetadata(embed) {
    try {
      const mediasIds = _.map(embed.medias, (media) => {
        const countryId = _.get(media, 'place.country._id');
        const placeId = _.get(media, 'place._id');
        const mediaId = _.get(media, '_id');

        return { mediaId, placeId, countryId };
      });

      const thingId = _.get(embed, 'thing._id');

      return {
        _id: embed._id.toString(),
        thing_id: thingId.toString(),
        medias_ids: encodeURIComponent(JSON.stringify(_.map(mediasIds, 'mediaId'))),
        places_ids: encodeURIComponent(JSON.stringify(_.map(mediasIds, 'placeId'))),
        countries_ids: encodeURIComponent(JSON.stringify(_.map(mediasIds, 'countryId'))),
        env: embed.env,
        lang: embed.lang,
        version: embed.version,
        resolution: embed.resolution,
        created_at: embed.createdAt.toString(),
        updated_at: embed.updatedAt.toString()
      };
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  // tslint:disable-next-line:prefer-function-over-method
  private isAllVersionsValid(items: { updatedAt: object }[], embedVersion: number, currentDate: number) {
    return _.every(items, (item) => {
      return embedVersion > _.get(item, 'updatedAt', currentDate).valueOf();
    });
  }
}
