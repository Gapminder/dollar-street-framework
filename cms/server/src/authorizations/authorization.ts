export const authorization = (app) => {
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/authorize`, (req, res) => {
    if (!req.user) {
      return res.json({ hasUser: false });
    }

    if (req.user.role === 'admin') {
      return res.json({ user: 'admin', hasUser: true });
    } else {
      return res.json({ user: 'user', hasUser: true });
    }
  });
};
