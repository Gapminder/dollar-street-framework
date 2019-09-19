// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as AWS from 'aws-sdk';
import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');

export const users = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const region = nconf.get('S3_REGION');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  AWS.config.region = region;
  AWS.config.update({
    accessKeyId: nconf.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('S3_SECRET_ACCESS_KEY')
  });

  const s3 = new AWS.S3();

  app.get(`/${CMS_SERVER_VERSION}/users`, isAdmin, getUsersList.bind(getUsersList, S3_SERVER));
  app.delete(`/${CMS_SERVER_VERSION}/users/:id`, isAdmin, removeUser.bind(removeUser, S3_BUCKET, s3));
};

function getUsersList(S3_SERVER, req, res) {
  Users.find(
    {
      role: { $ne: 'admin' }
    },
    {
      role: 1,
      email: 1,
      avatar: 1,
      lastName: 1,
      firstName: 1
    }
  )
    .lean()
    .exec((err, _users) => {
      if (err) {
        return res.json({ success: err, msg: [], data: _users, error: err });
      }

      _.forEach(_users, (user) => {
        user.fullName = '';

        if (user.firstName || user.lastName) {
          user.fullName = `${user.firstName || ''} ${user.lastName || ''}`;
        }

        if (user.avatar) {
          user.avatar = `${S3_SERVER}${user.avatar}`;
        }
      });

      res.json({ success: !err, msg: [], data: _.sortBy(_users, 'fullName'), error: err });
    });
}

function removeUser(S3_BUCKET, s3, req, res) {
  const params = req.params;

  const filename = `users/${params.id}/avatar.jpg`;
  const query = {
    Bucket: S3_BUCKET,
    Delete: {
      Objects: [{ Key: filename }]
    }
  };

  s3.deleteObjects(query, (err, data) => {
    if (err) {
      return res.json({ success: !err, msg: [], data, error: err });
    }

    Users.remove({ _id: params.id }, (error) => {
      res.json({ success: !error, msg: [], data: 1, error });
    });
  });
}
