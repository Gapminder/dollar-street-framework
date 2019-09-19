import { Application } from 'express';
import * as mongoose from 'mongoose';
import '../../repositories';
import '../../models/typesPlaces.js';
import '../../models/categories.js';
import '../../models/forms.js';
import '../../models/questions.js';

interface RequestParams {
  collect: string;
  field: string;
  value: string;
}

export const initController = async (app: Application) => {
  const nconf = app.get('nconf');

  const {
    THING_ICON,
    THING_NAME,
    THING_HOME,
    PLACE_TYPE_INIT,
    FORM_NAME_V3,
    FORM_NAME_V2,
    FORM_NAME_V1,
    QUESTIONS_THING_NAME,
    QUESTIONS_THING_FIRST_NAME
  } = nconf.get('DEFAULT_STATE');

  const relationsSet = {
    familyIconThing: { collect: 'Things', field: 'thingName', value: THING_ICON },
    familyThing: { collect: 'Things', field: 'thingName', value: THING_NAME },
    placeType: { collect: 'TypesPlaces', field: 'name', value: PLACE_TYPE_INIT },
    homeThing: { collect: 'Things', field: 'thingName', value: THING_HOME },
    questionnaireV3: { collect: 'Forms', field: 'name', value: FORM_NAME_V3 },
    questionnaireV2: { collect: 'Forms', field: 'name', value: FORM_NAME_V2 },
    questionnaireV1: { collect: 'Forms', field: 'name', value: FORM_NAME_V1 },
    familyName: { collect: 'Questions', field: 'name', value: QUESTIONS_THING_NAME },
    interviewedPerson: { collect: 'Questions', field: 'name', value: QUESTIONS_THING_FIRST_NAME }
  };

  try {
    const [
      familyIconThingId,
      familyThingId,
      placeTypeId,
      homeThingId,
      questionnaireV3,
      questionnaireV2,
      questionnaireV1,
      familyNameId,
      interviewedPerson
    ] = await Promise.all([
      getObjectId(relationsSet.familyIconThing),
      getObjectId(relationsSet.familyThing),
      getObjectId(relationsSet.placeType),
      getObjectId(relationsSet.homeThing),
      getObjectId(relationsSet.questionnaireV3),
      getObjectId(relationsSet.questionnaireV2),
      getObjectId(relationsSet.questionnaireV1),
      getObjectId(relationsSet.familyName),
      getObjectId(relationsSet.interviewedPerson)
    ]);

    nconf.set('familyIconThingId', familyIconThingId ? familyIconThingId._id.toString() : undefined);
    nconf.set('placeTypeId', placeTypeId ? placeTypeId._id.toString() : undefined);
    nconf.set('homeThingId', homeThingId ? homeThingId._id.toString() : undefined);
    nconf.set('questionnaireV3', questionnaireV3 ? questionnaireV3._id.toString() : undefined);
    nconf.set('questionnaireV2', questionnaireV2 ? questionnaireV2._id.toString() : undefined);
    nconf.set('questionnaireV1', questionnaireV1 ? questionnaireV1._id.toString() : undefined);
    nconf.set('familyNameId', familyNameId ? familyNameId._id.toString() : undefined);
    nconf.set('interviewedPerson', interviewedPerson ? interviewedPerson._id.toString() : undefined);
    nconf.set('familyThingId', familyThingId ? familyThingId._id.toString() : undefined);

    return;
  } catch (err) {
    console.error(err);

    throw new Error(err);
  }
};

async function getObjectId(params: RequestParams): Promise<mongoose.Document> {
  const { collect, field, value } = params;
  const modelCollection = mongoose.model(collect);
  const searchParams = JSON.parse(`{"${field}": "${value}"}`);

  return modelCollection
    .findOne(searchParams, { _id: 1 })
    .lean()
    .exec() as Promise<mongoose.Document>;
}
