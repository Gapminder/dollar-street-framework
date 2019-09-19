import * as express from 'express';

import { initConfig } from './config/index';
import '../../server/src/models';
import { configIo } from './config/io';
import { initSrc } from './src';

const app = express();

initConfig(app);

const healthCheck = app.get('health-check.middleware');
const serveStatic = app.get('serve-static.middleware');
const serveIndexFile = app.get('serve-index.middleware');

app.use(healthCheck);
app.use(serveStatic);
app.use(serveIndexFile);

const nconf = app.get('nconf');
const port = nconf.get('CMS_EXTERNAL_PORT');

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});

configIo(app);
initSrc(app);
