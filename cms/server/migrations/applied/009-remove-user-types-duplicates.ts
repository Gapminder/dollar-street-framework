import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';

const UsersTypes = mongoose.model('UsersTypes');
const Users = mongoose.model('Users');

exports.up = (next) => {
  getAllUsersTypes((err, types) => {
    if (err) {
      return next(err);
    }

    const uniqUsersTypes = _.chain(types)
      .map((type) => new Object({ name: type.name, id: type._id }))
      .uniqBy('name')
      .value();

    getAllUsers((err, users) => {
      if (err) {
        return next(err);
      }

      const usersArray = _.map(users, (user) => {
        const userTypeName = _.find(types, { _id: user.type });

        return { id: user._id, type: userTypeName.name };
      });

      updateUsersTypes(usersArray, uniqUsersTypes, (err, data) => {
        if (err) {
          return next(err);
        }

        removeNotUsedTypes(types, uniqUsersTypes, next);
      });
    });
  });
};

function getAllUsers(cb) {
  Users.find({}, { type: 1 })
    .lean()
    .exec(cb);
}

function getAllUsersTypes(cb) {
  UsersTypes.find({}, { name: 1 })
    .lean()
    .exec(cb);
}

function updateUsersTypes(users, uniqUsersTypes, cb) {
  const usersFuncArr = _.map(users, (user) => {
    return (cb) => {
      const currentUserType = _.first(uniqUsersTypes, { name: user.type });

      Users.update({ _id: user.id }, { update: { $set: { type: currentUserType.id } } }).exec(cb);
    };
  });

  async.parallel(usersFuncArr, cb);
}

function removeNotUsedTypes(types, uniqTypes, cb) {
  const typesToRemove = types.filter((type) => {
    const typeInUniq = _.find(uniqTypes, { id: type._id });

    return !typeInUniq;
  });

  const usersTypesFuncArr = _.map(typesToRemove, (type) => {
    return (cb) => UsersTypes.remove({ _id: type._id }).exec(cb);
  });

  async.parallel(usersTypesFuncArr, cb);
}

exports.down = (next) => {
  next();
};
