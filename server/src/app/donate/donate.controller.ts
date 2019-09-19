import { Application, Request, Response } from 'express';
import * as Stripe from 'stripe';

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');

  const BASE_HREF = config.get('BASE_HREF');
  const stripe = new Stripe(config.get('STRIPE_PRIVATE_KEY'));

  app.post(`${BASE_HREF}/v1/donate`, compression(), makeDonate);

  async function makeDonate(req: Request, res: Response): Promise<Response> {
    const {
      token: {
        id: source,
        card: { name: tokenCardName }
      },
      amount
    } = req.body;

    try {
      const charge: Stripe.charges.ICharge = await stripe.charges.create({
        amount,
        currency: 'usd',
        source,
        description: 'Dollar Street Donate',
        receipt_email: tokenCardName
      });

      return res.json({ err: null, data: charge });
    } catch (error) {
      return res.status(401).json({ err: error, data: null });
    }
  }
};
