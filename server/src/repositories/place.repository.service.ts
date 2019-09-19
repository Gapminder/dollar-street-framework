import * as mongoose from 'mongoose';
import { PlaceEntity, PlacesByPhotografers, PlacesForMatrixBlock, PlacesQuery } from '../interfaces/places';
import { queryRetry } from './query-retry.decorator';

class PlacesRepositoryService {
  private readonly places: mongoose.Model<PlaceEntity>;

  constructor() {
    this.places = mongoose.model('Places');
  }

  @queryRetry()
  async getCountriesByPlaces(placeTypeId: mongoose.Types.ObjectId): Promise<{ country: string }[]> {
    return this.places
      .find(
        {
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          _id: 0,
          country: 1
        }
      )
      .lean()
      .exec() as Promise<{ country: string }[]>;
  }

  @queryRetry()
  async getCountriesByPlacesId(
    placesIds: string[],
    placeTypeId: mongoose.Types.ObjectId
  ): Promise<{ country: string }[]> {
    return this.places
      .find(
        {
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          _id: { $in: placesIds },
          income: { $gt: 0 }
        },
        {
          _id: 0,
          country: 1
        }
      )
      .lean()
      .exec() as Promise<{ country: string }[]>;
  }

  @queryRetry()
  async getPlaces(placeId: mongoose.Types.ObjectId, placeTypeId: mongoose.Types.ObjectId): Promise<string[]> {
    const query: PlacesQuery = {
      isTrash: false,
      list: 'white',
      type: placeTypeId
    };

    if (placeId) {
      query._id = placeId;
    }

    return this.places
      .find(query)
      .distinct('_id')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getPlace(placeId: string, langUse: string): Promise<PlacesForMatrixBlock> {
    return this.places
      .findOne(
        {
          _id: placeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          country: 1,
          income: 1,
          familyInfoSummary: 1,
          author: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<PlacesForMatrixBlock>;
  }

  @queryRetry()
  async getMatrixPlaces(countries: string[], placeTypeId) {
    const query: PlacesQuery = {
      type: placeTypeId,
      list: 'white',
      isTrash: false
    };

    if (countries.length) {
      query.country = { $in: countries };
    }

    query.income = { $gt: 0 };

    return this.places
      .find(query, {
        country: 1,
        income: 1,
        incomeQuality: 1,
        date: 1
      })

      .sort({ income: 1 })
      .lean()
      .exec();
  }

  @queryRetry()
  async getPlacesIdsByCountries(countries: string[], placeTypeId: mongoose.Types.ObjectId): Promise<string[]> {
    const query = {
      isTrash: false,
      list: 'white',
      type: placeTypeId,
      country: { $in: countries }
    };

    return this.places
      .find(query)
      .distinct('_id')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getIncomePlacesByCountryId(
    countryId: mongoose.Types.ObjectId,
    placeTypeId: mongoose.Types.ObjectId
  ): Promise<PlaceEntity[]> {
    return this.places
      .find(
        {
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 },
          country: countryId
        },
        {
          income: 1
        }
      )
      .sort({ income: 1 })
      .lean()
      .exec() as Promise<PlaceEntity[]>;
  }

  @queryRetry()
  async getPlacesQuantity(countryId: mongoose.Types.ObjectId, placeTypeId: mongoose.Types.ObjectId): Promise<string[]> {
    return this.places
      .find({
        country: countryId,
        type: placeTypeId,
        list: 'white',
        isTrash: false,
        income: { $gt: 0 }
      })
      .distinct('_id')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getPlaceById(
    placeId: mongoose.Types.ObjectId,
    placeTypeId: mongoose.Types.ObjectId,
    langUse: string
  ): Promise<PlaceEntity> {
    return this.places
      .findOne(
        {
          _id: placeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 },
          type: placeTypeId
        },
        {
          country: 1,
          income: 1,
          familyInfo: 1,
          familyInfoSummary: 1,
          author: 1,
          aboutData: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<PlaceEntity>;
  }

  @queryRetry()
  async getAuthorIdByPlaceId(placeId: mongoose.Types.ObjectId): Promise<{ author: mongoose.Types.ObjectId }> {
    return this.places
      .findOne({ _id: placeId }, { author: 1 })
      .lean()
      .exec() as Promise<{ author: mongoose.Types.ObjectId }>;
  }

  @queryRetry()
  async getCountry(placeId: mongoose.Types.ObjectId): Promise<{ country: string }> {
    return this.places
      .findOne(
        {
          _id: placeId,
          list: 'white',
          isTrash: false
        },
        {
          country: 1
        }
      )
      .lean()
      .exec() as Promise<{ country: string }>;
  }

  @queryRetry()
  async getExistCountriesByCountries(countriesIds: string[], placeTypeId: string): Promise<string[]> {
    return this.places
      .find({
        type: placeTypeId,
        list: 'white',
        isTrash: false,
        country: { $in: countriesIds }
      })
      .distinct('country')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getPlacesByPhotographer(userId: string, placeTypeId: mongoose.Types.ObjectId): Promise<PlaceEntity[]> {
    return this.places
      .find(
        {
          type: placeTypeId,
          author: userId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          income: 1,
          country: 1
        }
      )
      .lean()
      .exec() as Promise<PlaceEntity[]>;
  }

  @queryRetry()
  async getPlacesIds(
    userId: mongoose.Types.ObjectId,
    placeTypeId: mongoose.Types.ObjectId
  ): Promise<{ _id: string }[]> {
    return this.places
      .find(
        {
          author: userId,
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          _id: 1
        }
      )
      .lean()
      .exec() as Promise<{ _id: string }[]>;
  }

  @queryRetry()
  async getPlacesByIds(
    placesIds: mongoose.Types.ObjectId[],
    placeTypeId: mongoose.Types.ObjectId
  ): Promise<PlaceEntity[]> {
    return this.places
      .find(
        {
          _id: { $in: placesIds },
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          income: 1,
          country: 1
        }
      )
      .sort({ income: 1 })
      .lean()
      .exec() as Promise<PlaceEntity[]>;
  }

  @queryRetry()
  async getPhotographersPlaces(placeTypeId: mongoose.Types.ObjectId): Promise<PlacesByPhotografers[]> {
    return this.places
      .find(
        {
          type: placeTypeId,
          list: 'white',
          isTrash: false,
          income: { $gt: 0 }
        },
        {
          author: 1,
          country: 1
        }
      )
      .lean()
      .exec() as Promise<PlacesByPhotografers[]>;
  }
}

export const placesRepositoryService = new PlacesRepositoryService();
