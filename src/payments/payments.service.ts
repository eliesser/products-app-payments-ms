import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentsSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession({ currency, items, orderId }: PaymentsSessionDto) {
    const line_items = items.map(({ name, price, quantity }) => ({
      price_data: {
        currency,
        product_data: {
          name,
        },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    }));

    return await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel',
    });
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    // Testing
    // const endpointSecret = 'whsec_b354215ac568b9fb91c60ca880388eaa4a7fa41a8ffc1709817d5befe2d0f8df';

    // Real
    const endpointSecret = 'whsec_PBWEUsErWiwGwqF0JTuv4LmvIrMND3Ee';

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'charge.succeeded') {
      const chargeSucceeded = event.data.object;

      console.log(chargeSucceeded.metadata.orderId);
    }

    return res.status(200).json({ sig });
  }
}
