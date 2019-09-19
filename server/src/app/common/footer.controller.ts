import { head } from 'lodash';
import { Express, Request, Response } from 'express';
import { footerRepositoryService } from '../../repositories/footer.repository.service';

const ERROR_CODE = 303;

module.exports = (app: Express) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/footer-text/`, compression(), getFooterText);
};

async function getFooterText(req: Request, res: Response): Promise<Response | void> {
  try {
    const {
      query: { lang: langUse }
    } = req;
    const footer = await footerRepositoryService.getFooter(langUse);

    if (!footer) {
      throw new Error(`Error: Footer does not exist!`);
    }

    const translation = head(footer.translations);

    footer.text = translation ? translation.text : footer.text;

    delete footer.translations;

    return res.json({ success: true, msg: [], data: footer, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for footer: ${ERROR_CODE}` });
  }
}
