import { head, map } from 'lodash';
import { Request, Response, Application } from 'express';
import { Onboarding, TranslatedOnboarding } from '../../interfaces/onboarding';
import { onboardingRepositoryService } from '../../repositories/onboarding.repository.service';

const ERROR_CODE = 305;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/onboarding/`, compression(), getData);
};

async function getData(req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { lang: langUse }
    } = req;
    const onboardingData: Onboarding[] = await onboardingRepositoryService.getOnboardings(langUse);

    if (!onboardingData) {
      throw new Error('Error: Onboardings were not found!');
    }

    const data: TranslatedOnboarding[] = setData(onboardingData);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for onboarding: ${ERROR_CODE}` });
  }
}

function setData(data: Onboarding[]) {
  return map(data, (item: Onboarding) => {
    const translation = head(item.translations);

    if (translation) {
      item.header = translation.header || item.header;
      item.description = translation.description || item.description;
    }

    return {
      _id: item._id,
      header: item.header,
      description: item.description,
      name: item.name
    };
  });
}
