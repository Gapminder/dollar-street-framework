// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const User = mongoose.model('Users');

export const local = (app) => {
  const passport = app.get('passport');
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.post(`/${CMS_SERVER_VERSION}/users`, (req, res) => {
    User.count({ email: req.body.email }).exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
  });

  app.get(`/${CMS_SERVER_VERSION}/check-email`, (req, res) => {
    User.count({ email: req.query.email }).exec((err, data) => {
      res.json({ success: !err, msg: [], data: data > 0, error: err });
    });
  });

  app.get(`/${CMS_SERVER_VERSION}/check-username`, (req, res) => {
    const query: { username: string; _id?: { $ne: mongoose.Types.ObjectId } } = { username: req.query.username };

    if (req.user && req.user._id) {
      query._id = { $ne: req.user._id };
    }

    User.count(query).exec((err, data) => {
      res.json({ success: !err, msg: [], data: data > 0, error: err });
    });
  });

  app.post(`/${CMS_SERVER_VERSION}/login`, (req, res, next) => {
    passport.authenticate('local-login', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.send({ success: false, error: err });
      }

      req.login(user, (loginUserError) => {
        if (loginUserError) {
          return next(loginUserError);
        }

        return res.send({ success: true, error: loginUserError });
      });
    })(req, res, next);
  });

  app.post(
    `/${CMS_SERVER_VERSION}/signup`,
    passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/registration'
    })
  );

  app.post(`/${CMS_SERVER_VERSION}/log`, (req, res) => {
    const body = req.body;
    const query = JSON.parse(body.log_obj);

    User.find(query)
      .limit(1)
      .lean()
      .exec((err, users) => {
        if (err) {
          console.log(err);
        }

        const user = users[0];

        if (user) {
          res.json({ success: 'true', id: user._id });

          return;
        }

        res.json({ success: 'false' });
      });
  });
};
