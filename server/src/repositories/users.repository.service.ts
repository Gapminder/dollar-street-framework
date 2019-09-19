import * as mongoose from 'mongoose';
import { Users, UsersForPhotographers } from '../interfaces/users';
import { queryRetry } from './query-retry.decorator';

class UsersRepositoryService {
  private readonly users: mongoose.Model<Users>;

  constructor() {
    this.users = mongoose.model('Users');
  }

  @queryRetry()
  async getPhotographer(photographerId: mongoose.Types.ObjectId, langUse: string): Promise<Users> {
    return this.users
      .findOne(
        {
          _id: photographerId
        },
        {
          firstName: 1,
          lastName: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<Users>;
  }

  @queryRetry()
  async getUsers(userId: string): Promise<Users> {
    return this.users
      .find({ _id: userId }, { password: 0, salt: 0 })
      .lean()
      .exec() as Promise<Users>;
  }

  @queryRetry()
  async getPhotographerPlaces(userId: mongoose.Types.ObjectId, langUse: string): Promise<Users> {
    return this.users
      .findOne(
        { _id: userId },
        {
          avatar: 1,
          country: 1,
          google: 1,
          facebook: 1,
          twitter: 1,
          linkedIn: 1,
          firstName: 1,
          lastName: 1,
          description: 1,
          company: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .populate([{ path: 'country', select: 'country alias translations' }])
      .lean()
      .exec() as Promise<Users>;
  }

  @queryRetry()
  async getUsersForPhotographers(langUse: string): Promise<UsersForPhotographers[]> {
    return this.users
      .find(
        {},
        {
          _id: 1,
          avatar: 1,
          firstName: 1,
          lastName: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<UsersForPhotographers[]>;
  }

  @queryRetry()
  async getTeam(S3_SERVER: string): Promise<object[]> {
    return this.users.collection
      .aggregate([
        {
          $match: {
            role: 'ambassador',
            firstName: { $exists: true },
            lastName: { $exists: true },
            country: { $exists: true },
            priority: { $exists: true }
          }
        },
        {
          $sort: { priority: 1 }
        },
        {
          $group: {
            _id: '$type',
            ambassadors: {
              $addToSet: {
                name: { $concat: ['$firstName', ' ', '$lastName'] },
                country: '$country',
                description: '$description',
                avatar: { $concat: [S3_SERVER, '$avatar'] },
                company: '$company',
                translations: '$translations',
                priority: '$priority'
              }
            }
          }
        }
      ])
      .toArray() as Promise<object[]>;
  }
}

export const usersRepositoryService = new UsersRepositoryService();
