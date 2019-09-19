import * as express from 'express';
import * as bodyParser from 'body-parser';
import { credentialsService } from '../../../common/credential.service';
import { createImage } from './index';

const pathToCredentials = '../../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const router = express.Router();
router.route('/').post(async (req, res) => {
  return createImage(req, res);
});

app.use('/embed', router);
app.all('/healthz', (req, res) => {
  return res.status(200).json({ success: true, method: req.method });
});

const port = actualCredentials.get('CLUSTER_PUPPETEER_EXTERNAL_PORT');

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
