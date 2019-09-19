import * as mongoose from 'mongoose';
import { Onboarding } from '../interfaces/onboarding';
import { queryRetry } from './query-retry.decorator';

class OnboardingRepositoryService {
  private readonly onboarding: mongoose.Model<Onboarding>;

  constructor() {
    this.onboarding = mongoose.model('Onboarding');
  }

  @queryRetry()
  async getOnboardings(langUse: string): Promise<Onboarding[]> {
    const projection = {
      name: 1,
      header: 1,
      description: 1,
      link: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.onboarding
      .find({}, projection)
      .lean()
      .exec() as Promise<Onboarding[]>;
  }
}

export const onboardingRepositoryService = new OnboardingRepositoryService();
