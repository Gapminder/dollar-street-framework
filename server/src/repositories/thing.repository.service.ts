import * as mongoose from 'mongoose';
import {
  CategoriesForThings,
  ThingByPlural,
  ThingForHomeMediaViewBlock,
  Things,
  ThingsForHomeMedia
} from '../interfaces/things';
import { ThingForArticles } from '../interfaces/thingForArticles';
import { queryRetry } from './query-retry.decorator';

class ThingRepositoryService {
  private readonly things: mongoose.Model<Things>;

  constructor() {
    this.things = mongoose.model('Things');
  }

  @queryRetry()
  async getThingForArticles(thingId: string, langUse: string): Promise<ThingForArticles> {
    return this.things
      .findOne(
        { _id: thingId },
        {
          thingName: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<ThingForArticles>;
  }

  @queryRetry()
  async getThingByName(thing: string): Promise<{ _id: mongoose.Types.ObjectId }> {
    return this.things
      .findOne({ plural: thing, list: 'white' }, { _id: 1 })
      .lean()
      .exec() as Promise<{ _id: mongoose.Types.ObjectId }>;
  }

  @queryRetry()
  async getThingsForImages(
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<{ _id: string; thingName: string }[]> {
    return this.things
      .find({ _id: { $in: [familyThingId, homeThingId] } }, { thingName: 1 })
      .lean()
      .exec() as Promise<{ _id: string; thingName: string }[]>;
  }

  @queryRetry()
  async getThingByPluralName(name: string, langUse: string): Promise<ThingByPlural> {
    return this.things
      .findOne(
        {
          plural: name
        },
        {
          plural: 1,
          thingName: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<ThingByPlural>;
  }

  @queryRetry()
  async getCategoriesForThings(langUse: string, thingsId: string[]): Promise<CategoriesForThings[]> {
    return this.things
      .find(
        {
          _id: { $in: thingsId },
          list: 'white'
        },
        {
          synonymous: 1,
          thingName: 1,
          relatedThings: 1,
          plural: 1,
          icon: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<CategoriesForThings[]>;
  }

  @queryRetry()
  async getThingData(langUse: string, thingId: mongoose.Types.ObjectId): Promise<CategoriesForThings> {
    return this.things
      .findOne(
        {
          _id: thingId,
          list: 'white'
        },
        {
          synonymous: 1,
          thingName: 1,
          relatedThings: 1,
          plural: 1,
          icon: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<CategoriesForThings>;
  }

  @queryRetry()
  async getThingNameByThingId(familyThingId: mongoose.Types.ObjectId, langUse: string): Promise<{ plural: string }> {
    const query = { _id: familyThingId };
    const projection = {
      plural: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.things
      .findOne(query, projection)
      .lean()
      .exec() as Promise<{ plural: string }>;
  }

  @queryRetry()
  async getFamilyThing(langUse: string, thingId: mongoose.Types.ObjectId): Promise<ThingByPlural> {
    return this.things
      .findOne(
        {
          _id: thingId
        },
        {
          thingName: 1,
          plural: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<ThingByPlural>;
  }

  @queryRetry()
  async getThingsForHomeMedia(
    langUse: string,
    familyIconThingId: mongoose.Types.ObjectId
  ): Promise<ThingsForHomeMedia[]> {
    return this.things
      .find(
        {
          _id: { $ne: familyIconThingId },
          list: 'white'
        },
        {
          thingName: 1,
          plural: 1,
          thingCategory: 1,
          icon: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .populate([{ path: 'thingCategory', select: 'name' }])
      .lean()
      .exec() as Promise<ThingsForHomeMedia[]>;
  }

  @queryRetry()
  async getThingHomeMediaViewBlock(
    langUse: string,
    thingId: mongoose.Types.ObjectId
  ): Promise<ThingForHomeMediaViewBlock> {
    return this.things
      .findOne(
        {
          _id: thingId
        },
        {
          icon: 1,
          plural: 1,
          thingName: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<ThingForHomeMediaViewBlock>;
  }

  @queryRetry()
  async getThingsForFamilyAndHome(
    familyThingId: mongoose.Types.ObjectId,
    homeThingId: mongoose.Types.ObjectId
  ): Promise<Things[]> {
    return this.things
      .find({ _id: { $in: [homeThingId, familyThingId] } }, { thingName: 1 })
      .lean()
      .exec() as Promise<Things[]>;
  }

  @queryRetry()
  async getThingsFamilyAndHome(
    homeThingId: mongoose.Types.ObjectId,
    familyThingId: mongoose.Types.ObjectId
  ): Promise<{ _id: string; thingName: string }[]> {
    return this.things
      .find({ _id: { $in: [homeThingId, familyThingId] } }, { thingName: 1 })
      .lean()
      .exec() as Promise<{ _id: string; thingName: string }[]>;
  }

  @queryRetry()
  async countImagesForCountry(thingsIds: string[]): Promise<number> {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return this.things
      .count({
        _id: { $in: thingsIds },
        list: 'white'
      })
      .exec() as Promise<number>;
  }

  @queryRetry()
  async getWhiteListThings(thingsIds: string[]): Promise<string[]> {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return this.things
      .find(
        {
          _id: { $in: thingsIds },
          list: 'white'
        },
        { _id: 1 }
      )
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getWhiteListThingsIds(): Promise<{ _id: mongoose.Types.ObjectId }[]> {
    return this.things
      .find(
        {
          list: 'white'
        },
        { _id: 1 }
      )
      .lean()
      .exec() as Promise<{ _id: mongoose.Types.ObjectId }[]>;
  }
}

export const thingRepositoryService = new ThingRepositoryService();
