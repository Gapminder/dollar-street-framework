import * as mongoose from 'mongoose';
import { EmbedDTO, EmbedQuery } from '../interfaces/embed';
import { queryRetry } from './query-retry.decorator';
import * as _ from 'lodash';

class EmbedRepositoryService {
  embed: mongoose.Model<EmbedDTO>;

  constructor() {
    this.embed = mongoose.model('Embed');
  }

  // @queryRetry()
  async upsertEmbed(newEmbed: EmbedQuery): Promise<EmbedDTO> {
    const subquery = _.omit(newEmbed, ['medias']);
    const query = Object.assign({}, subquery, {
      $and: [{ medias: { $size: _.size(newEmbed.medias) } }, ..._.map(newEmbed.medias, (item) => ({ medias: item }))]
    });

    let existedEmbed = await this._findEmbed(query);

    if (!existedEmbed) {
      existedEmbed = await this._createEmbed(newEmbed);
    }

    const populatedEmbed = await this._populateEmbed(existedEmbed);

    return populatedEmbed.toObject();
  }

  @queryRetry()
  async createEmbed(query: object): Promise<EmbedDTO> {
    const existedEmbed = await this._createEmbed(query);

    await this._populateEmbed(existedEmbed);

    return existedEmbed.toObject();
  }

  @queryRetry()
  async findEmbed(query: object): Promise<EmbedDTO> {
    try {
      const existedEmbed = await this._findEmbed(query);

      await this._populateEmbed(existedEmbed);

      return existedEmbed.toObject();
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  async updateEmbedById(embedId: string, embedEnv: string): Promise<EmbedDTO> {
    const updatedEmbed = await this.embed.findOneAndUpdate({ _id: embedId }, { env: embedEnv }, { new: true }).exec();

    return updatedEmbed.toObject();
  }

  // @queryRetry()
  // tslint:disable-next-line:prefer-function-over-method
  private _populateEmbed(existedEmbed) {
    return existedEmbed
      .populate('thing')
      .populate({
        path: 'medias',
        populate: {
          path: 'place',
          populate: {
            path: 'country',
            populate: {
              path: 'region',
              model: 'Regions'
            }
          }
        }
      })
      .execPopulate();
  }

  @queryRetry()
  private async _createEmbed(query: object): Promise<EmbedDTO> {
    return this.embed.create(query);
  }

  // @queryRetry()
  private async _findEmbed(query: object): Promise<EmbedDTO> {
    return this.embed.findOne(query).exec();
  }
}

export const embedRepositoryService = new EmbedRepositoryService();
