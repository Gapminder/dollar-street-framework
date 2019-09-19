// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as AWS from 'aws-sdk';
import * as mongoose from 'mongoose';
import { ThingEntity, ThingQuery } from './things.interface';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Categories = mongoose.model('Categories');

let homeId;

export const things = (app) => {
  const hasUser = app.get('validate').hasUser;
  const isAdmin = app.get('validate').isAdmin;

  const nconf = app.get('nconf');
  const region = nconf.get('S3_REGION');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');
  const S3_BUCKET = nconf.get('S3_BUCKET');

  AWS.config.region = region;
  AWS.config.update({
    accessKeyId: nconf.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('S3_SECRET_ACCESS_KEY')
  });

  homeId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));

  const s3 = new AWS.S3();

  app.get(`/${CMS_SERVER_VERSION}/things/`, hasUser, returnAllThings);
  app.get(`/${CMS_SERVER_VERSION}/things-for-set-related-things`, hasUser, getAllThingsForSetRelatedThings);
  app.get(`/${CMS_SERVER_VERSION}/things/next`, hasUser, returnPagingThings);
  app.post(`/${CMS_SERVER_VERSION}/thing/new`, hasUser, createNewThing.bind(createNewThing, S3_BUCKET, s3));
  app.post(`/${CMS_SERVER_VERSION}/thing/edit/:id`, hasUser, editThing.bind(editThing, S3_BUCKET, s3));
  app.post(`/${CMS_SERVER_VERSION}/thing/:id/list`, hasUser, editThingList);
  app.post(`/${CMS_SERVER_VERSION}/thing/main`, hasUser, editIsMainPage);
  app.post(`/${CMS_SERVER_VERSION}/things/updateCategory`, hasUser, updateCategory);
  app.post(`/${CMS_SERVER_VERSION}/thing/remove/:id`, isAdmin, removeThing.bind(removeThing, S3_BUCKET, s3));
  app.get(
    `/${CMS_SERVER_VERSION}/thing/remove/icon/:id`,
    isAdmin,
    removeThingIcon.bind(removeThingIcon, S3_BUCKET, s3)
  );
  app.get(`/${CMS_SERVER_VERSION}/things-for-images-filter`, hasUser, getThingsForImagesFilter);
};

function removeThingIcon(S3_BUCKET, s3, req, res) {
  const id = req.params.id;

  Things.update({ _id: id }, { $unset: { icon: 1 } }).exec((err) => {
    if (err) {
      return res.json({ success: !err, msg: [], data: false, error: err });
    }

    removeFileFromAmazon(S3_BUCKET, s3, id, (error) => res.json({ success: !error, msg: [], data: true, error }));
  });
}

function validationReqFields(thing) {
  if (thing.synonymous) {
    thing.synonymous = JSON.parse(thing.synonymous);
  }

  if (thing.tags) {
    thing.tags = JSON.parse(thing.tags);
  }

  if (thing.thingCategory) {
    thing.thingCategory = JSON.parse(thing.thingCategory);
  }

  if (thing.relatedThings) {
    thing.relatedThings = JSON.parse(thing.relatedThings);
  }
}

function createNewThing(S3_BUCKET, s3, req, res) {
  const _thing = _.omit(req.body, 'icon');

  let iconOfThing = _.pick(req.body, 'icon');

  if (iconOfThing) {
    iconOfThing = iconOfThing.icon;
  }

  validationReqFields(_thing);

  const thing = new Things(_thing);

  thing.save((err, createdThing: ThingEntity) => {
    const _createdThing = createdThing.toObject();

    if (err) {
      return res.json({ success: !err, msg: [], data: false, action: 'create', error: err });
    }

    if (!iconOfThing) {
      delete _createdThing.icon;

      return res.json({ success: !err, msg: [], data: _createdThing, action: 'create', error: err });
    }

    amazonPutObject({ S3_BUCKET, s3, _id: _createdThing._id, icon: iconOfThing }, (error) => {
      if (error) {
        console.log(error);
      }

      _createdThing.icon = `${_createdThing._id}.svg`;

      updateThing(_createdThing, (updateThingError) => {
        if (updateThingError) {
          console.log(updateThingError);
        }

        res.json({
          success: !updateThingError,
          msg: [],
          data: _createdThing,
          action: 'create',
          error: updateThingError
        });
      });
    });
  });
}

function editThing(S3_BUCKET, s3, req, res) {
  const thing = _.omit(req.body, 'icon');

  thing._id = req.params.id;

  let iconOfThing = _.pick(req.body, 'icon');

  if (iconOfThing) {
    iconOfThing = iconOfThing.icon;
  }

  validationReqFields(thing);

  if (!iconOfThing) {
    updateThing(thing, (err) => {
      thing.icon = `${thing._id}.svg`;
      res.json({ success: !err, msg: [], data: thing, error: err });
    });

    return;
  }

  amazonPutObject({ S3_BUCKET, s3, _id: thing._id, icon: iconOfThing }, (err) => {
    if (err) {
      console.log(err);
    }

    thing.icon = `${thing._id}.svg`;

    updateThing(thing, (updateThingError) => {
      res.json({ success: !updateThingError, msg: [], data: thing, action: 'edit', error: updateThingError });
    });
  });
}

function editIsMainPage(req, res) {
  const id = req.body.id;
  const isPublic = req.body.isPublic;

  Things.update(
    {
      _id: id
    },
    {
      $set: {
        isPublic
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function editThingList(req, res) {
  const thingId = req.params.id;
  const list = req.body.list;

  Things.update(
    {
      _id: thingId
    },
    {
      $set: {
        list
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function removeThing(S3_BUCKET, s3, req, res) {
  const id = req.params.id;
  const icon = req.body.icon;

  /*todo: add remove thing from media,similarities,differences,articles*/
  Things.remove({ _id: id }, (err) => {
    if (err) {
      return res.json({ success: !err, msg: [], data: false, error: err });
    }

    if (!icon) {
      return res.json({ success: !err, msg: [], data: true, error: err });
    }

    removeFileFromAmazon(S3_BUCKET, s3, id, (error) => {
      if (error) {
        return res.json({ success: !error, msg: [], data: false, error });
      }

      res.json({ success: !error, msg: [], data: true, error });
    });
  });
}

function removeFileFromAmazon(S3_BUCKET, s3, id, cb) {
  const colors = ['FCB42D', '808080', '2C4351', 'FFFFFF'];

  async.each(
    colors,
    (color, callback) => {
      const filename = `thing/${id}/${color}-${id}.svg`;
      const params = {
        Bucket: S3_BUCKET,
        Delete: {
          Objects: [{ Key: filename }]
        }
      };

      s3.deleteObjects(params, callback);
    },
    cb
  );
}

function updateThing(thing, cb) {
  const id = thing._id;

  delete thing._id;

  Things.update(
    { _id: id },
    {
      $set: thing
    }
  ).exec((err) => {
    if (err) {
      console.log(err);
    }

    thing._id = id;

    cb(err);
  });
}

function amazonPutObject(paramsToUpload, cb) {
  const colors = ['FCB42D', '808080', '2C4351', 'FFFFFF'];

  async.each(
    colors,
    (color, callback) => {
      const filename = `thing/${paramsToUpload._id}/${color}-${paramsToUpload._id}.svg`;
      const content = paramsToUpload.icon.replace(/\#\w{6}/gi, `#${color}`);
      const params = {
        Bucket: paramsToUpload.S3_BUCKET,
        Key: filename,
        ContentType: 'image/svg+xml',
        Body: Buffer.from(content),
        ACL: 'public-read',
        CacheControl: 'max-age=2628000'
      };

      paramsToUpload.s3.putObject(params, callback);
    },
    cb
  );
}

function returnPagingThings(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  Things.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function returnAllThings(req, res) {
  Things.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function getAllThingsForSetRelatedThings(req, res) {
  Things.find({ _id: { $ne: homeId } }, { thingName: 1 })
    .lean()
    .sort({ thingName: 1 })
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function updateCategory(req, res) {
  const _things: ThingEntity[] = req.body;

  async.each(
    _things,
    (thing: ThingEntity, cb) => {
      Things.update(
        { _id: thing._id },
        {
          $set: {
            thingCategory: thing.thingCategory
          }
        }
      ).exec(cb);
    },
    (err) => {
      res.json({ success: !err, msg: [], data: true, error: err });
    }
  );
}

function preparationQuery(request) {
  const query: ThingQuery = {};

  if (request.list) {
    query.list = request.list;
  }

  if (request.thingName) {
    query.$or = query.$or || [];
    query.$or.push({ thingName: { $regex: request.thingName, $options: 'i' } });
    query.$or.push({ thingDescription: { $regex: request.thingName, $options: 'i' } });
  }

  return query;
}

function preparationSort(request) {
  let query = {};

  if (request.sort) {
    query = JSON.parse(request.sort);
  }

  return query;
}

function getThingsForImagesFilter(req, res) {
  const query = req.query;
  const placeId = mongoose.Types.ObjectId(query.place);

  async.parallel(
    {
      hashThingsImages: getThingsImages(placeId),
      things: getThings
    },
    (err, result: { things: ThingEntity[]; hashThingsImages: { [key: string]: number } }) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: result, error: err });
      }

      const categoriesId = _.chain(result.things)
        .map('thingCategory')
        .flatten()
        .value();

      getCategoriesByThings(categoriesId, (error, categories) => {
        if (error) {
          return res.json({ success: !error, msg: [], data: categories, error });
        }

        _.forEach(result.things, (thing: ThingEntity & { images: number; categories: string }) => {
          thing.images = result.hashThingsImages[thing._id.toString()] || 0;
          thing.categories = thing.thingCategory.join();
          delete thing.thingCategory;
        });

        res.json({ success: !error, msg: [], data: { things: result.things, categories }, error });
      });
    }
  );
}

function getThingsImages(placeId) {
  return (cb) => {
    Media.collection
      .aggregate([
        {
          $match: {
            place: placeId,
            isTrash: false
          }
        },
        {
          $project: {
            _id: 1,
            things: 1
          }
        },
        {
          $unwind: '$things'
        },
        {
          $group: {
            _id: '$things._id',
            images: { $sum: 1 }
          }
        }
      ])
      .toArray((err, data) => {
        if (err) {
          return cb(err);
        }

        const hashImagesByThings = _.reduce(
          data,
          (result, thing) => {
            result[thing._id.toString()] = thing.images;

            return result;
          },
          {}
        );

        cb(null, hashImagesByThings);
      });
  };
}

function getCategoriesByThings(categoriesId, cb) {
  Categories.find(
    {
      _id: { $in: categoriesId }
    },
    {
      name: 1
    }
  )
    .sort({ name: 1 })
    .lean()
    .exec(cb);
}

function getThings(cb) {
  Things.find(
    {},
    {
      thingName: 1,
      thingCategory: 1
    }
  )
    .sort({ thingName: 1 })
    .lean()
    .exec(cb);
}
