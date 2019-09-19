import * as passport from 'passport';
import * as logger from 'morgan';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { compressionMiddleware } from './compression.middleware';
import { serveStaticMiddleware } from './serve-static.middleware';

export const expressConfig = (app) => {
  app.use(logger('dev'));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
  app.use(cookieParser());
  app.use(
    session({
      secret: 'keyboard cat',
      proxy: true,
      resave: true,
      saveUninitialized: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.set('passport', passport);

  compressionMiddleware(app);
  serveStaticMiddleware(app);
};
