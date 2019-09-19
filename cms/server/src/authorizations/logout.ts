export const logout = (app) => {
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/logout`, (req, res) => {
    req.logout();

    res.json({ success: true, data: { redirect: 'login' } });
  });
};
