import * as mongoose from 'mongoose';
import { UserTypeEntity } from '../interfaces/usersTypes';
import { queryRetry } from './query-retry.decorator';

class UserTypesRepositoryService {
  private readonly userTypes: mongoose.Model<UserTypeEntity>;

  constructor() {
    this.userTypes = mongoose.model('UsersTypes');
  }

  @queryRetry()
  async getUsersTypes(langUse: string): Promise<UserTypeEntity[]> {
    return this.userTypes
      .find(
        { isPublic: true },
        {
          name: 1,
          position: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<UserTypeEntity[]>;
  }
}

export const userTypesRepositoryService = new UserTypesRepositoryService();
