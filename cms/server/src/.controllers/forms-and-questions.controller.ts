import { questions } from '../formsAndQuestions/questions';
import { forms } from '../formsAndQuestions/forms';

export const formsAndQuestions = (app) => {
  questions(app);
  forms(app);
};
