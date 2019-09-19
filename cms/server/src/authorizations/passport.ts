// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as passport from 'passport';
import * as bcrypt from 'bcrypt-nodejs';
import { UserEntity } from '../user/users.interfaces';

import { Strategy as LocalStrategy } from 'passport-local';
import { UserTypeEntity } from '../../../../server/src/interfaces/usersTypes';

// tslint:disable-next-line:variable-name
const User = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const UsersTypes = mongoose.model('UsersTypes');

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      User.find({ $or: [{ email }, { username: email }] })
        .limit(1)
        .exec((err, users) => {
          if (err) {
            return done(err);
          }

          const user: UserEntity = users[0].toObject();

          if (!user) {
            return done(null, false);
          }

          bcrypt.hash(password, user.salt, null, (error, userPassword) => {
            if (error) {
              console.log(error);
            }

            if (user.password !== userPassword) {
              return done(null, false);
            }

            if (user.password === userPassword) {
              return done(null, user);
            }
          });
        });
    }
  )
);

passport.use(
  'local-signup',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      const body = req.body;

      bcrypt.genSalt(10, (saltError, salt) => {
        if (saltError) {
          console.log('saltError: ', saltError);

          return done(saltError);
        }

        bcrypt.hash(password, salt, null, (err, hash) => {
          if (err) {
            console.log(err);

            return done(err);
          }

          process.nextTick(() => {
            getUsersTypeWriter((error, data: UserTypeEntity[]) => {
              if (error) {
                console.error(error);
              }

              let type = _.find(data, { name: 'Writer' });

              if (!type) {
                type = data[0];
              }

              const newUser = new User({
                email,
                password: hash,
                salt,
                firstName: body.firstName,
                lastName: body.lastName,
                username: body.username,
                country: body.country.replace('string:', ''),
                role: 'ambassador',
                type: type._id
              });

              newUser.save((saveNewUserError) => {
                if (saveNewUserError) {
                  console.log(saveNewUserError);

                  return done(saveNewUserError);
                }

                done(null, newUser);
              });
            });
          });
        });
      });
    }
  )
);

function getUsersTypeWriter(cb) {
  UsersTypes.find({})
    .lean()
    .exec(cb);
}
