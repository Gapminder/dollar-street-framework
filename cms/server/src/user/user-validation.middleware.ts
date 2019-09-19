export const validationUser = function router(app) {
  const validate = {
    isAdmin: (req, res, next) => {
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      res.redirect('/');
    },
    hasUser: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }

      res.redirect('/login');
    },
    checkAdmin: (req) => {
      if (req.user && req.user.role === 'admin') {
        return true;
      }

      return false;
    }
  };

  app.set('validate', validate);
};
