import { user } from '../user/user.controller';
import { users } from '../user/users.controller';
import { photographer } from '../user/photographer.controller';
import { usersTypes } from '../user/users-types.controller';

export const profiles = (app) => {
  user(app);
  users(app);
  photographer(app);
  usersTypes(app);
};
