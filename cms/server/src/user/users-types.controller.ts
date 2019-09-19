// tslint:disable:no-floating-promises

import * as async from 'async';
import * as mongoose from 'mongoose';
import { UserTypeEntity } from '../../../../server/src/interfaces/usersTypes';

// tslint:disable-next-line:variable-name
const UsersTypes = mongoose.model<UserTypeEntity>('UsersTypes');

export const usersTypes = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/users/types`, hasUser, getUsersTypesList);
  app.put(`/${CMS_SERVER_VERSION}/users/types/public`, isAdmin, editUserTypePublic);
  app.put(`/${CMS_SERVER_VERSION}/users/types/position`, isAdmin, editTypePosition);
  app.post(`/${CMS_SERVER_VERSION}/users/types/new`, isAdmin, createUserType);
  app.post(`/${CMS_SERVER_VERSION}/users/types/remove/:id`, isAdmin, removeUserType);
  app.put(`/${CMS_SERVER_VERSION}/users/types/edit/:id`, isAdmin, editUserType);
};

function createUserType(req, res) {
  const typeName = req.body.name;
  const typePosition = req.body.position;

  const userType = new UsersTypes({
    name: typeName,
    position: typePosition,
    isPublic: false
  });

  userType.save((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function removeUserType(req, res) {
  const typeId = req.params.id;

  UsersTypes.remove({ _id: typeId }).exec((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function editUserType(req, res) {
  const body = req.body;
  const typeId = req.params.id;

  UsersTypes.update({ _id: typeId }, { $set: { name: body.name } }).exec((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function getUsersTypesList(req, res) {
  UsersTypes.find({})
    .sort('name')
    .lean()
    .exec((err, types) => {
      res.json({ success: !err, msg: [], data: types, error: err });
    });
}

function editUserTypePublic(req, res) {
  const body = req.body;

  UsersTypes.update({ _id: body._id }, { $set: { isPublic: body.isPublic } }).exec((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function editTypePosition(req, res) {
  const body = req.body;

  async.each(
    body.types,
    (type: { _id: mongoose.Types.ObjectId; position: number }, cb) => {
      UsersTypes.update(
        { _id: type._id },
        {
          $set: {
            position: type.position
          }
        },
        cb
      );
    },
    (err) => {
      res.json({ success: !err, msg: [], data: true, error: err });
    }
  );
}
