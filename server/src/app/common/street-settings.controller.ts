import { Request, Response, Application } from 'express';

import { Street } from '../../interfaces/street';
import { streetRepositoryService } from '../../repositories/street.repository.service';

const ERROR_CODE = 307;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/street-settings/`, compression(), getStreetSettingsData);
};

async function getStreetSettingsData(req: Request, res: Response): Promise<Response> {
  try {
    const data: Street = await streetRepositoryService.getStreet();

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for street settings: ${ERROR_CODE}` });
  }
}
