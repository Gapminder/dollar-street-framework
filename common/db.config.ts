// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

export const dbConfig = (nconf) => {
  const mongoUri = nconf.get('MONGODB_URL');

  mongoose.set('useFindAndModify', false);

  const db = mongoose.connection;

  const connectWithRetry = () => {
    mongoose.connect(mongoUri, { useNewUrlParser: true, connectTimeoutMS: 5000 }, (err) => {
      if (err) {
        console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
        setTimeout(connectWithRetry, 5000);
      }
    });
  };

  /*eslint-disable*/
  db.once('error', (err) => {
    console.log('db connect error', err);
    connectWithRetry();
  });
  db.once('connecting', () => console.log('db connecting...', mongoUri));
  db.once('connected', () => console.log('db connect good: ', mongoUri));
  db.once('reconnected', () => console.log('db reconnected...', mongoUri));
  db.once('close', () => console.log('db connect close'));
  /*eslint-enable*/

  connectWithRetry();
};
