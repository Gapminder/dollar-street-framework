// tslint:disable:no-floating-promises

import * as async from 'async';
import * as mongoose from 'mongoose';
import * as nodemailer from 'nodemailer';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');

let transporter;
let CMS_APPROVE_MAIL;
let CMS_APPROVE_PASSWORD;

export const approve = (app) => {
  const nconf = app.get('nconf');
  const hasUser = app.get('validate').hasUser;
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  CMS_APPROVE_MAIL = nconf.get('CMS_APPROVE_MAIL');
  CMS_APPROVE_PASSWORD = nconf.get('CMS_APPROVE_PASSWORD');
  transporter = nodemailer.createTransport(
    `smtps://${CMS_APPROVE_MAIL.replace('@', '%40')}:${CMS_APPROVE_PASSWORD}@smtp.gmail.com`
  );

  app.post(`/${CMS_SERVER_VERSION}/request-approval/:id`, hasUser, requestApproval);
  app.post(`/${CMS_SERVER_VERSION}/approve-images`, hasUser, approveImages);
};

function requestApproval(req, res) {
  const params = req.params;
  const user = req.user;

  async.parallel(
    {
      sentToAdmin: sentToAdmin(user, params.id),
      sentToUser: sentToUser(user, params.id)
    },
    (err, results) => {
      res.json({ success: !err, msg: [], data: results, error: err });
    }
  );
}

function approveImages(req, res) {
  const body = req.body;
  const imagesId = body.imagesId;
  const placeId = body.placeId;

  async.parallel(
    {
      updateImages: updateImages(imagesId),
      user: getUserByPlace(placeId)
    },
    (err, results) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: results, error: err });
      }

      const user = results.user[0];

      const mailOptions = {
        from: CMS_APPROVE_MAIL,
        to: user.email,
        subject: 'Approve media',
        text: `Hello ${user.firstName} ${user.lastName}.`,
        html:
          // tslint:disable:max-line-length
          `<h3>Hello ${user.firstName} ${
            user.lastName
          }.</h3><p>I am Admin of site Dollar Street. And I want say you that we approved yours media</p><p>Go to: <a href="http://stage.dollarstreet.org/cms/admin/place/${placeId}">Your place</a></p>`
        // tslint:enable:max-line-length
      };

      transporter.sendMail(mailOptions, (error, info) => {
        res.json({ success: !error, msg: [], data: info, error: err });
      });
    }
  );
}

function updateImages(imagesId) {
  return (cb) => {
    Media.update({ _id: { $in: imagesId } }, { $set: { isApproved: true } }, { multi: true }).exec(cb);
  };
}

function getUserByPlace(placeId) {
  return (cb) => {
    Places.find({ _id: placeId }, { author: 1 })
      .limit(1)
      .lean()
      .exec((err, data) => {
        if (err) {
          return cb(err);
        }

        const userId = data[0].author;

        Users.find({ _id: userId }, { email: 1, firstName: 1, lastName: 1 })
          .limit(1)
          .lean()
          .exec(cb);
      });
  };
}

function sentToAdmin(user, placeId) {
  return (cb) => {
    const mailOptions = {
      from: user.email,
      to: CMS_APPROVE_MAIL,
      subject: 'Approve media',
      text: 'Hello admin.',
      html:
        // tslint:disable:max-line-length
        `<h3>Hello Admin.</h3><p>My name is ${user.firstName} ${
          user.lastName
        }</p><p>I uploaded new media and I want that my media will be approved</p><p>Please approve my media: <a href="http://stage.dollarstreet.org/cms/admin/place/${placeId}">Link</a></p>`
      // tslint:enable:max-line-length
    };

    transporter.sendMail(mailOptions, cb);
  };
}

function sentToUser(user, placeId) {
  return (cb) => {
    const mailOptions = {
      from: CMS_APPROVE_MAIL,
      to: user.email,
      subject: 'Approve media',
      text: 'Hello photographer.',
      html:
        // tslint:disable:max-line-length
        `<h3>Hello ${user.firstName} ${
          user.lastName
        }.</h3><p>Your request was sent to admin for approval.</p><p>Your media: <a href="http://stage.dollarstreet.org/cms/admin/place/${placeId}">Link</a></p><p>Regards, the administration DollarStreet.</p>`
      // tslint:enable:max-line-length
    };

    transporter.sendMail(mailOptions, cb);
  };
}
