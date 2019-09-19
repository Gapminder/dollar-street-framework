import { head } from 'lodash';
import { Request, Response, Application } from 'express';
import { ThingByPlural } from '../../interfaces/things';
import { thingRepositoryService } from '../../repositories/thing.repository.service';

const ERROR_CODE = 308;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/thing`, compression(), getData);
};

async function getData(req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { name: thingName, lang: langUse }
    } = req;
    const thingByName: ThingByPlural = await thingRepositoryService.getThingByPluralName(thingName, langUse);

    if (!thingByName) {
      throw new Error(`Error: Things by name ${thingName} were not found!`);
    }

    thingByName.originPlural = thingByName.plural;
    thingByName.originThingName = thingByName.thingName;

    const translation = head(thingByName.translations);

    if (translation) {
      thingByName.plural = translation.plural;
      thingByName.thingName = translation.thingName;

      delete thingByName.translations;
    }

    return res.json({ success: true, data: thingByName, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, data: null, error: `Error code for thing: ${ERROR_CODE}` });
  }
}
