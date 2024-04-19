import { Inject, Injectable } from '@nestjs/common';
import { NATS_SERVICE, envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentsSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

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

    const paymentSession = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return {
      cancelUrl: paymentSession.cancel_url,
      successUrl: paymentSession.success_url,
      url: paymentSession.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    // Real
    const endpointSecret = envs.stripeEndpointSecret;

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

      const payload = {
        stripePaymentId: chargeSucceeded.id,
        orderId: chargeSucceeded.metadata.orderId,
        receiptUrl: chargeSucceeded.receipt_url,
      };

      this.client.emit('payment.succeeded', payload);
    }

    return res.status(200).json({ sig });
  }
}
