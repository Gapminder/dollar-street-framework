import * as cron from 'cron';
import * as request from 'request';
import { forEach, get, uniq } from 'lodash';
import { config } from '../../config/config';
import '../../models/exchange';
import { logger } from '../../../../common/log';
import { Exchange, ExchangeUpdate } from '../../interfaces/exchange';
import { exchangeRepositoryService } from '../../repositories/exchange.repository.service';

const CronJob = cron.CronJob;

// todo: update after refactoring config and db config (remove app)
const app = {
  get(key) {
    // tslint:disable-next-line:no-invalid-this
    return this[key];
  },
  set(key, value) {
    // tslint:disable-next-line:no-invalid-this
    this[key] = value;

    // tslint:disable-next-line:no-invalid-this
    return this;
  }
};

config(app);

const URL = 'http://free.currencyconverterapi.com/api/v3/convert?compact=y&';
const TIMEZONE = 'Europe/Dublin';
const OUTDATED = 86400000; // 1 day in milliseconds

let currenciesToUpdate: string[] = [];

export const updateCurrency = (): void => {
  const cronCurrency = new CronJob(
    '0 1 * * * * *',
    (): void => {
      getNewCurrency(currenciesToUpdate);
    },
    null,
    false,
    TIMEZONE
  );
  // tslint:disable:no-unused-variable
  const cronGetExchanges = new CronJob(
    // tslint:enable:no-unused-variable
    '0 1 * * * * *',
    async (): Promise<void> => {
      try {
        const data: Exchange[] = await exchangeRepositoryService.getExchanges();

        const addToUpdate: string[] = filterToUpdate(data);

        if (addToUpdate.length) {
          currenciesToUpdate = uniq([...addToUpdate, ...currenciesToUpdate]);

          if (!get(cronCurrency, 'running', true)) {
            cronCurrency.start();
            logger.info('update currencies started');
          }

          if (!currenciesToUpdate.length) {
            cronCurrency.stop();
          }
        }
      } catch (error) {
        logger.error(error);
      }
    },
    null,
    true,
    TIMEZONE
  );
};

function filterToUpdate(data: Exchange[]): string[] {
  const addToUpdate: string[] = [];

  forEach(
    data,
    (current: Exchange, index: number): void => {
      const updatedTime = new Date(+current.updated).getTime();
      const diff = Date.now() - updatedTime;
      if (diff >= OUTDATED) {
        addToUpdate.push(current.code);
      }
    }
  );

  return addToUpdate;
}

async function setUpdatedCurrency(key: string, _value: number): Promise<void> {
  try {
    const data: ExchangeUpdate = {
      value: _value,
      updated: new Date()
    };

    await exchangeRepositoryService.updateExchange(key, data);
  } catch (error) {
    logger.error(error);
  }
}

function getNewCurrency(currencies: string[]): void {
  if (currencies.length) {
    const current: string = currencies.pop();
    const url = `${URL}q=USD_${current}`;
    console.log('current: ', current);
    request.get(
      url,
      async (err: Error, res: Response, body: string): Promise<void> => {
        if (err) {
          logger.error(err);

          return;
        }
        let bodyJSON;
        try {
          bodyJSON = JSON.parse(body);
        } catch (err) {
          logger.error(err);
        }

        if (bodyJSON[`USD_${current}`]) {
          await setUpdatedCurrency(current, bodyJSON[`USD_${current}`][`val`]);
        }
      }
    );
  }
}
