export const sockets = (app) => {
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/sockets`, getInstanceId(nconf));
};

function getInstanceId(nconf) {
  return (req, res) => {
    const port = parseInt(nconf.get('CMS_SOCKETS_PORT'), 10);

    res.json({ port });
  };
}
