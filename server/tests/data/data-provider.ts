import { Regions } from '../../src/interfaces/regions';
import { EmbedCountry } from '../../src/interfaces/locations';
import { EmbedPlace } from '../../src/interfaces/places';
import { EmbedThing } from '../../src/interfaces/things';
import { EmbedMedia } from '../../src/interfaces/media';
import { Embed, EmbedDTO } from '../../src/interfaces/embed';
import * as mongoose from 'mongoose';
import '../../src/models';
import { EmbedParams } from '../../src/interfaces/puppeteer.interfaces';

const EmbedModel = mongoose.model<EmbedDTO>('Embed');

export class DataProvider {
  static imageDownload = {
    JpgImage: {
      id: '5af044d98ab4151b759f2e6e',
      name: '',
      contentDisposition: 'attachment; filename="original-e77c32c1-84ae-485e-aef8-25d276cb7a98.jpg"'
    },
    PngToJpgImage: {
      id: '59bc23f378528b007e575514',
      name: '',
      contentDisposition: 'attachment; filename="original-ae592f68-2cfc-4578-a788-1c63d21dbbac.jpg"'
    },
    PngErrorImage: { name: 'fakejpg.jpg' }
  };

  static validId = '5cd3f7592b0dae0978cfda52';
  static invalidId = 'invalidId';

  static existedRegion1 = { _id: '58f5e172410ed2018368c679', name: 'Region1' } as Regions;

  static existedRegion2 = { _id: '58f5e172410ed2018368c678', name: 'Region2' } as Regions;

  static existedCountry1 = {
    _id: '546ccf730f7ddf45c017962f',
    list: 'white',
    isPublic: true,
    region: DataProvider.existedRegion1,
    name: 'Country1',
    lng: 12,
    lat: 34,
    country: 'Country1',
    alias: 'Country 1',
    empty: false,
    createdAt: new Date('2019-05-09T12:48:09.417+03:00'),
    updatedAt: new Date('2019-05-09T12:48:09.417+03:00')
  } as EmbedCountry;

  static existedCountry2 = Object.assign(
    {},
    {
      ...DataProvider.existedCountry1,
      name: 'Country2',
      country: 'Country2',
      alias: 'Country 2'
    }
  ) as EmbedCountry;

  static existedPlace1 = {
    _id: '546ccf730f7ddf45c017962f',
    list: 'white',
    isPublic: true,
    isTrash: false,
    country: DataProvider.existedCountry1,
    background: '',
    image: '',
    income: 123,
    lat: 34,
    lng: 12
  } as EmbedPlace;

  static existedPlace2 = Object.assign(
    {},
    {
      ...DataProvider.existedPlace1,
      country: DataProvider.existedCountry1
    }
  ) as EmbedPlace;

  static existedThing = {
    _id: '546ccf730f7ddf45c017962f',
    list: 'white',
    isPublic: true,
    hidden: 'show',
    thingName: '',
    originThingName: '',
    plural: '',
    originPlural: '',
    empty: false
  } as EmbedThing;

  static existedMedia1: EmbedMedia = {
    _id: '5afecdf6c1c65a5c0a125a72',
    isTrash: false,
    isApproved: true,
    things: [DataProvider.existedThing],
    place: DataProvider.existedPlace1,
    show: 'true',
    filename: '',
    originFile: '',
    amazonfilename: 'test/embed_123.jpeg',
    src: '',
    rotate: 0,
    size: '',
    isHouse: true,
    isPortrait: false,
    isIcon: false,
    type: ''
  } as EmbedMedia;

  static existedMedia2: EmbedMedia = Object.assign(
    {},
    {
      ...DataProvider.existedMedia1,
      _id: '54b68d0738ef07015525f671',
      things: [DataProvider.existedThing],
      place: DataProvider.existedPlace2
    }
  ) as EmbedMedia;

  static embedId = new mongoose.Types.ObjectId('5cd3f7592b0dae0978cfda52');

  static populatedEmbed = {
    _id: DataProvider.embedId,
    medias: [DataProvider.existedMedia1, DataProvider.existedMedia2],
    version: 'v1',
    thing: DataProvider.existedThing,
    lang: 'en',
    env: 'ds',
    resolution: '480x480',
    createdAt: new Date('2019-05-09T12:48:09.417+03:00'),
    updatedAt: new Date('2019-05-09T12:48:09.417+03:00'),
    currentId: DataProvider.embedId,
    toObject: async () => {
      return;
    }
  } as Embed;

  static existedEmbed: EmbedDTO = new EmbedModel({
    _id: DataProvider.embedId,
    medias: [DataProvider.existedMedia1._id, DataProvider.existedMedia2._id],
    version: 'v1',
    thing: DataProvider.existedThing._id,
    lang: 'en',
    env: 'ds',
    resolution: '480x480',
    createdAt: '2019-05-09T12:48:09.417+03:00',
    updatedAt: '2019-05-09T12:48:09.417+03:00',
    currentId: '5cd3f7592b0dae0978cfda52'
  });

  static embedParams = {
    tool: 'testDefaultCase',
    medias: `${DataProvider.existedMedia1._id},${DataProvider.existedMedia2._id}`,
    thingId: DataProvider.existedThing._id,
    lang: 'en',
    requestUuid: 'test',
    referer: 'http://localhost:3000',
    resolution: '480х480',
    mediasIds: [DataProvider.existedMedia1._id, DataProvider.existedMedia2._id]
  } as EmbedParams;
}
