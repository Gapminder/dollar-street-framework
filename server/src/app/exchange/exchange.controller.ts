import { Application, Request, Response } from 'express';
import { exchangeRepositoryService } from '../../repositories/exchange.repository.service';

const ERROR_CODE = 315;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');
  const statusError = 500;

  app.get(`${BASE_HREF}/v1/get-exchange-data`, compression(), getExchangeData);

  async function getExchangeData(req: Request, res: Response) {
    try {
      const data = await exchangeRepositoryService.getExchanges();

      return res.send({ err: null, success: true, data });
    } catch (err) {
      console.error(err);

      return res
        .status(statusError)
        .send({ err: `Error code for exchange: ${ERROR_CODE}`, success: false, data: null });
    }
  }
};
