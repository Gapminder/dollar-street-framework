import * as express from 'express';
import * as bodyParser from 'body-parser';
import { createImage } from './index';
import { initConfigs } from '../../../server/src/config';

const app = express();
initConfigs(app);

app.use(bodyParser.json());
app.all('/', (req, res) => {
  return createImage(req, res);
});

const nconf = app.get('nconf');
const port = nconf.get('EXTERNAL_PORT') || nconf.get('DEFAULT_EXTERNAL_PORT');

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
