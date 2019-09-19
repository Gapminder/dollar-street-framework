import * as mongoose from 'mongoose';
import { InfoPlaces, MatrixBlockInfoPlaces } from '../interfaces/infoPlaces';
import { queryRetry } from './query-retry.decorator';

class InfoPlacesRepositoryService {
  private readonly infoPlaces: mongoose.Model<InfoPlaces>;

  constructor() {
    this.infoPlaces = mongoose.model('InfoPlaces');
  }

  @queryRetry()
  async getInfoPlaceByPlacesIds(
    placesIds: mongoose.Types.ObjectId[],
    questionId: mongoose.Types.ObjectId,
    langUse: string,
    questionnaireV3: mongoose.Types.ObjectId,
    questionnaireV2: mongoose.Types.ObjectId,
    questionnaireV1: mongoose.Types.ObjectId
  ): Promise<InfoPlaces[]> {
    return this.infoPlaces
      .find(
        {
          place: { $in: placesIds },
          question: questionId,
          form: { $in: [questionnaireV3, questionnaireV2, questionnaireV1] }
        },
        {
          _id: 0,
          form: 1,
          place: 1,
          answer: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<InfoPlaces[]>;
  }

  @queryRetry()
  async getInfoPlacesById(
    placeId: mongoose.Types.ObjectId,
    questionId: mongoose.Types.ObjectId,
    langUse: string,
    questionnaireV3: mongoose.Types.ObjectId,
    questionnaireV2: mongoose.Types.ObjectId,
    questionnaireV1: mongoose.Types.ObjectId
  ): Promise<InfoPlaces[]> {
    return this.infoPlaces
      .find(
        {
          place: placeId,
          question: questionId,
          form: { $in: [questionnaireV3, questionnaireV2, questionnaireV1] }
        },
        {
          _id: 0,
          form: 1,
          answer: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<InfoPlaces[]>;
  }

  @queryRetry()
  async getInfoPlace(
    placeId: string,
    questionId: mongoose.Types.ObjectId,
    langUse: string,
    questionnaireV3: mongoose.Types.ObjectId,
    questionnaireV2: mongoose.Types.ObjectId,
    questionnaireV1: mongoose.Types.ObjectId
  ): Promise<MatrixBlockInfoPlaces[]> {
    return this.infoPlaces
      .find(
        {
          place: placeId,
          question: questionId,
          form: { $in: [questionnaireV3, questionnaireV2, questionnaireV1] }
        },
        {
          _id: 0,
          form: 1,
          answer: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<MatrixBlockInfoPlaces[]>;
  }
}

export const infoPlacesRepositoryService = new InfoPlacesRepositoryService();
