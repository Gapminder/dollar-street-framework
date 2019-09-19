import * as mongoose from 'mongoose';
import { GetMediaOptions, MatrixBlockMedia, Media, PlacesForEmbed } from '../interfaces/media';
import { Images, ImagesForMap } from '../interfaces/images';
import { map } from 'lodash';
import { queryRetry } from './query-retry.decorator';

class MediaRepositoryService {
  private readonly media: mongoose.Model<Media>;

  constructor() {
    this.media = mongoose.model('Media');
  }

  @queryRetry()
  async getPlacesIdForThing(
    thing: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId,
    familyThingId: mongoose.Types.ObjectId
  ): Promise<string[]> {
    const query: {
      isTrash: boolean;
      isApproved: boolean;
      isHouse?: boolean;
      isPortrait?: boolean;
      'things.hidden': string;
      'things._id': mongoose.Types.ObjectId;
    } = {
      isTrash: false,
      isApproved: true,
      'things.hidden': 'show',
      'things._id': thing
    };

    if (thing.toString() === homeThingId.toString()) {
      query.isHouse = true;
    }

    if (thing.toString() === familyThingId.toString()) {
      query.isPortrait = true;
    }

    return this.media
      .find(query)
      .distinct('place')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getImagesByPlaces(
    placesIds: mongoose.Types.ObjectId,
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<Images[]> {
    return this.media.collection
      .aggregate([
        {
          $match: {
            place: { $in: placesIds },
            $or: [
              {
                isPortrait: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              },
              {
                'things.hidden': 'show',
                'things._id': homeThingId
              }
            ],
            isTrash: false,
            isApproved: true
          }
        },
        {
          $unwind: '$things'
        },
        {
          $match: {
            $or: [
              {
                isPortrait: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              },
              {
                isHouse: true,
                'things.hidden': 'show',
                'things._id': homeThingId
              }
            ]
          }
        },
        {
          $group: {
            _id: { _id: '$_id', thing: '$things._id' },
            place: { $first: '$place' },
            isPortrait: { $first: '$isPortrait' },
            amazonfilename: { $first: '$amazonfilename' },
            thing: { $first: '$things._id' },
            src: { $first: '$src' }
          }
        },
        {
          $project: {
            _id: '$_id._id',
            place: 1,
            isPortrait: 1,
            amazonfilename: 1,
            thing: 1,
            src: 1
          }
        },
        {
          $sort: { isPortrait: 1 }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getImagesForCountriesPlaces(
    placesIds: string[],
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<Images[]> {
    return this.media.collection
      .aggregate([
        {
          $match: {
            place: { $in: placesIds },
            isApproved: true,
            isTrash: false,
            'things.hidden': 'show',
            $or: [
              {
                'things._id': familyThingId,
                isPortrait: true
              },
              {
                'things._id': homeThingId,
                isHouse: true
              }
            ]
          }
        },
        {
          $unwind: '$things'
        },
        {
          $match: {
            $or: [
              {
                isPortrait: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              },
              {
                isHouse: true,
                'things.hidden': 'show',
                'things._id': homeThingId
              }
            ]
          }
        },
        {
          $group: {
            _id: { _id: '$_id', thing: '$things._id' },
            place: { $first: '$place' },
            isPortrait: { $first: '$isPortrait' },
            amazonfilename: { $first: '$amazonfilename' },
            thing: { $first: '$things._id' },
            src: { $first: '$src' }
          }
        },
        {
          $project: {
            _id: '$_id._id',
            place: 1,
            isPortrait: 1,
            amazonfilename: 1,
            thing: 1,
            src: 1
          }
        },
        {
          $sort: { isPortrait: 1 }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getImagesCount(placesIds: string[]): Promise<{ _id: string; imagesCount: number }[]> {
    return this.media.collection
      .aggregate([
        {
          $match: {
            place: { $in: placesIds },
            isApproved: true,
            isTrash: false,
            'things.hidden': 'show'
          }
        },
        {
          $group: {
            _id: '$place',
            imagesCount: { $sum: 1 }
          }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getMediaPlaces(placesIds: string[]): Promise<{ place: string }[]> {
    return this.media
      .find(
        {
          place: { $in: placesIds },
          isTrash: false,
          isApproved: true,
          'things.hidden': 'show'
        },
        { _id: 0, place: 1 }
      )
      .lean()
      .exec() as Promise<{ place: string }[]>;
  }

  @queryRetry()
  async getMediaThings(placesIds: string[]): Promise<{ _id: string }[]> {
    return this.media
      .find({
        place: { $in: placesIds },
        isTrash: false,
        isApproved: true,
        'things.hidden': 'show'
      })
      .distinct('things')
      .lean()
      .exec() as Promise<{ _id: string }[]>;
  }

  @queryRetry()
  async getPlacesByPortraitAndHouse(
    placesIds: string[],
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<string[]> {
    return this.media
      .find({
        place: { $in: placesIds },
        $or: [
          {
            isPortrait: true,
            'things.hidden': 'show',
            'things._id': familyThingId
          },
          {
            isHouse: true,
            'things.hidden': 'show',
            'things._id': homeThingId
          }
        ],
        isApproved: true,
        isTrash: false
      })
      .distinct('place')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getThingsIdByPlaces(placesIds: string[]): Promise<string[]> {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return this.media
      .find({
        place: { $in: placesIds },
        isTrash: false,
        isApproved: true,
        'things.hidden': 'show'
      })
      .distinct('things._id')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getMediaByPlaces(
    placesIds: string[],
    thingsIds: string[]
  ): Promise<{ place: string; things: { _id: string }[] }[]> {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return this.media
      .find(
        {
          place: { $in: placesIds },
          isTrash: false,
          isApproved: true,
          'things.hidden': 'show',
          'things._id': { $in: thingsIds }
        },
        { _id: 0, place: 1, 'things._id': 1 }
      )
      .lean()
      .exec() as Promise<{ place: string; things: { _id: string }[] }[]>;
  }

  @queryRetry()
  async getPlaceFamilyOrHousePhoto(
    placeId: mongoose.Types.ObjectId,
    thingId: mongoose.Types.ObjectId,
    type: string
  ): Promise<Images> {
    // tslint:disable-next-line:no-any
    const query: any = {
      place: placeId,
      isApproved: true,
      isTrash: false,
      'things._id': thingId,
      'things.hidden': 'show'
    };

    switch (type) {
      case 'family':
        query.isPortrait = true;
        break;
      case 'house':
        query.isHouse = true;
        break;
      case 'icon':
        query.isIcon = true;
        break;
      default:
        console.error('Type not found');
    }

    return this.media
      .findOne(query, {
        src: 1,
        amazonfilename: 1
      })
      .lean()
      .exec() as Promise<Images>;
  }

  @queryRetry()
  async getPlaceImages(
    placeId: mongoose.Types.ObjectId,
    thingsIds: mongoose.Types.ObjectId[],
    resolution: string,
    S3_SERVER: string
  ): Promise<Images[]> {
    return this.media.collection
      .aggregate([
        {
          $match: {
            place: placeId,
            isApproved: true,
            isTrash: false,
            'things.hidden': 'show',
            'things._id': { $in: thingsIds }
          }
        },
        {
          $unwind: '$things'
        },
        {
          $match: {
            'things._id': { $in: thingsIds },
            'things.hidden': 'show'
          }
        },
        {
          $project: {
            _id: 1,
            thing: '$things._id',
            background: {
              $concat: ['url("', S3_SERVER, '$src', resolution, '-', '$amazonfilename', '")']
            }
          }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getPlacesByFamilyPortraitAndHouse(
    places: { _id: string }[],
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<{ _id: string }[]> {
    const placesIds: mongoose.Types.ObjectId[] = map(places, (place) => mongoose.Types.ObjectId(place._id));

    return this.media.collection
      .aggregate([
        {
          $match: {
            place: { $in: placesIds },
            $or: [
              {
                isPortrait: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              },
              {
                isHouse: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              }
            ],
            isApproved: true,
            isTrash: false
          }
        },
        {
          $unwind: '$things'
        },
        {
          $match: {
            $or: [
              {
                isPortrait: true,
                'things.hidden': 'show',
                'things._id': familyThingId
              },
              {
                isHouse: true,
                'things.hidden': 'show',
                'things._id': homeThingId
              }
            ]
          }
        },
        {
          $group: {
            _id: '$place'
          }
        },
        {
          $project: {
            _id: '$_id'
          }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getPlacesIdsByThingFromMedia(activeThing: {
    _id: mongoose.Types.ObjectId;
  }): Promise<mongoose.Types.ObjectId[]> {
    const query = {
      isTrash: false,
      isApproved: true,
      'things.hidden': 'show',
      'things._id': activeThing._id
    };

    return this.media
      .find(query)
      .distinct('place')
      .exec();
  }

  @queryRetry()
  async getImagesByPlacesForMap(
    placesIds: mongoose.Types.ObjectId[],
    familyId: mongoose.Types.ObjectId,
    S3_SERVER: string
  ): Promise<ImagesForMap[]> {
    return this.media.collection
      .aggregate([
        {
          $match: {
            place: { $in: placesIds },
            isApproved: true,
            isTrash: false,
            'things.hidden': 'show',
            'things._id': familyId,
            isPortrait: true
          }
        },
        {
          $unwind: '$things'
        },
        {
          $match: {
            'things.hidden': 'show',
            'things._id': familyId
          }
        },
        {
          $group: {
            _id: '$place',
            family: {
              $first: {
                imageId: '$_id',
                background: { $concat: [S3_SERVER, '$src', 'thumb-', '$amazonfilename'] },
                thing: '$things._id'
              }
            }
          }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getEmbedMedia(options: GetMediaOptions): Promise<Media[]> {
    const { placesIds, thingId, FAMILY_THING_ID, HOME_THING_ID } = options;

    // tslint:disable:no-any
    const query: any = {
      // tslint:enable:no-any
      place: { $in: placesIds },
      isApproved: true,
      isTrash: false,
      'things.hidden': 'show',
      'things._id': thingId
    };

    if (thingId.toString() === FAMILY_THING_ID.toString()) {
      query.isPortrait = true;
    }

    if (thingId.toString() === HOME_THING_ID.toString()) {
      query.isHouse = true;
    }

    return this.media
      .find(query)
      .lean()
      .exec();
  }

  @queryRetry()
  async getMediaForMatrix(
    places: string[],
    thing: string,
    resolution: string,
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId,
    S3_SERVER: string
  ): Promise<Media[]> {
    // TODO: fix type for query
    // tslint:disable-next-line:no-any
    const query: any = {
      place: { $in: places },
      isApproved: true,
      isTrash: false,
      'things.hidden': 'show',
      'things._id': thing
    };

    if (thing.toString() === familyThingId.toString()) {
      query.isPortrait = true;
    }

    if (thing.toString() === homeThingId.toString()) {
      query.isHouse = true;
    }

    return this.media.collection
      .aggregate([
        {
          $match: query
        },
        {
          $unwind: '$things'
        },
        {
          $group: {
            _id: '$place',
            image: { $first: '$_id' },
            background: { $first: { $concat: [S3_SERVER, '$src', resolution, '-', '$amazonfilename'] } }
          }
        }
      ])
      .toArray();
  }

  @queryRetry()
  async getMatrixPlaceFamilyOrHousePhoto(placeId: string, thingId: string, type: string): Promise<MatrixBlockMedia> {
    // tslint:disable-next-line:no-any
    const query: any = {
      place: placeId,
      isApproved: true,
      isTrash: false,
      'things._id': thingId,
      'things.hidden': 'show'
    };

    if (type === 'family') {
      query.isPortrait = true;
    }

    if (type === 'house') {
      query.isHouse = true;
    }

    return this.media
      .findOne(query, {
        src: 1,
        amazonfilename: 1
      })
      .lean()
      .exec() as Promise<MatrixBlockMedia>;
  }

  async getMediaForEmbed(places: mongoose.Types.ObjectId[], thing: mongoose.Types.ObjectId): Promise<PlacesForEmbed[]> {
    return this.media
      .find({ things: { $elemMatch: { _id: thing } }, place: { $in: places } }, { _id: 1, place: 1 })
      .lean()
      .exec() as Promise<PlacesForEmbed[]>;
  }
}

export const mediaRepositoryService = new MediaRepositoryService();
