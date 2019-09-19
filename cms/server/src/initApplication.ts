// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';
import * as _ from 'lodash';

const relationsSet = {
  familyIconThing: { collect: 'Things', field: 'thingName', value: 'Family icon' },
  familyThing: { collect: 'Things', field: 'thingName', value: 'Family' },
  homeThing: { collect: 'Things', field: 'thingName', value: 'Home' }
};

export const initApplication = async (app) => {
  const config = app.get('nconf');

  try {
    const familyIconThingId = await getObjectId(relationsSet.familyIconThing);
    const familyThingId = await getObjectId(relationsSet.familyThing);
    const homeThingId = await getObjectId(relationsSet.homeThing);

    config.set('familyIconThingId', familyIconThingId);
    config.set('familyThingId', familyThingId);
    config.set('homeThingId', homeThingId);
  } catch (error) {
    throw error;
  }
};

async function getObjectId(params): Promise<string> {
  // tslint:disable-next-line:variable-name
  const Collection: mongoose.Model<mongoose.Document> = mongoose.model(params.collect);

  const field = params.field;
  const value = params.value;

  const searchParams = JSON.parse(`{"${field}": "${value}"}`);

  const [data] = await Collection.find(searchParams, { _id: 1 })
    .limit(1)
    .lean()
    .exec();

  const _id = _.get(data, '_id', false);

  return _id ? _id.toString() : '';
}
