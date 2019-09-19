import { credentialsService } from '../../../common/credential.service';
import * as _ from 'lodash';
import '../../../server/src/models';
import * as mongoose from 'mongoose';
import { dbConfig } from '../../../common/db.config';

const pathToCredentials = '../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

export async function run() {
  getVariablesFromCommonLine(actualCredentials);
  const donorDB = actualCredentials.get('DONOR_DB');
  const targetDB = actualCredentials.get('TARGET_DB');
  actualCredentials.stores.env.readOnly = false;

  try {
    actualCredentials.set('MONGODB_URL', donorDB);
    await dbConfig(actualCredentials);
    const placesDonorMongooseSchema = mongoose.model('Places');
    const donorPlaces = await placesDonorMongooseSchema
      .find({}, { name: 1, income: 1 })
      .lean()
      .exec();

    await mongoose.connection.close();
    actualCredentials.set('MONGODB_URL', targetDB);
    await dbConfig(actualCredentials);
    const placesTargetMongooseSchema = mongoose.model('Places');
    const targetPlaces = await placesTargetMongooseSchema
      .find({}, { name: 1, income: 1 })
      .lean()
      .exec();
    const different = _.differenceBy(donorPlaces, targetPlaces, 'income');

    for (const d of different) {
      await placesTargetMongooseSchema.update({ name: d.name }, { $set: { income: d.income } }, { multi: true });
    }
  } catch (error) {
    console.error(error);
  }
}

function getVariablesFromCommonLine(nconf) {
  const DONOR_DB = _.get(process.env, 'DONOR_DB', null);
  const TARGET_DB = _.get(process.env, 'TARGET_DB', null);
  if (!DONOR_DB || !TARGET_DB) {
    const error = 'Didn\'t find required variables "donorDB" or "targetDB"';
    console.error(error);
    throw new Error(error);
  }

  nconf.set('DONOR_DB', DONOR_DB);
  nconf.set('TARGET_DB', TARGET_DB);
}
