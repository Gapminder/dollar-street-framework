import '../authorizations/passport';
import { local } from '../authorizations/local';
import { authorization } from '../authorizations/authorization';
import { logout } from '../authorizations/logout';

export const authorizations = (app) => {
  local(app);
  authorization(app);
  logout(app);
};
