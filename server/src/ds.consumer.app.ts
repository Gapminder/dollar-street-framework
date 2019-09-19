import * as express from 'express';
import './models';
import { initConfigs } from './config';
import { initApp } from './app';

// import * as fs from 'fs';
// import * as http from 'http';
// import * as https from 'https';

// const privateKey  = fs.readFileSync('sslcert/key.pem', 'utf8');
// const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
// const httpsOptions = {key: privateKey, cert: certificate};

const app = express();

initConfigs(app);

const embedPreview = app.get('serve-embed-preview');
const healthCheck = app.get('health-check.middleware');
const serveStatic = app.get('serve-static.middleware');
const serveIndexFile = app.get('serve-index.middleware');

app.use(healthCheck);
app.use(embedPreview);
app.use(serveStatic);
app.use(serveIndexFile);

initApp(app);

const nconf = app.get('nconf');
const port = nconf.get('EXTERNAL_PORT') || nconf.get('DEFAULT_EXTERNAL_PORT');

// const httpServer = http.createServer(app);
// const httpsServer = https.createServer(httpsOptions, app);

// httpServer.listen(port, () => {
//   console.log(`Server listening http on port: ${port}`);
// });
// httpsServer.listen(8443,() => {
//   console.log(`Server listening https on port: 8443`);
// });

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
