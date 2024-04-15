import 'dotenv/config';
import * as joi from 'joi';

interface EnvsVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_ENDPOINT_SECRET_TEST: string;
  STRIPE_ENDPOINT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    STRIPE_ENDPOINT_SECRET_TEST: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({ ...process.env });

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvsVars = value;

export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  stripeEndpointSecretTest: envVars.STRIPE_ENDPOINT_SECRET_TEST,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
};
