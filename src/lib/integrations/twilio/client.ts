import twilio, { Twilio } from 'twilio';
import { TwilioError } from './types';

export class TwilioClient {
  private static instance: TwilioClient;
  private client: Twilio;

  private constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new TwilioError(
        'Missing Twilio credentials',
        'TWILIO_CREDENTIALS_MISSING',
        500
      );
    }

    this.client = twilio(accountSid, authToken);
  }

  public static getInstance(): TwilioClient {
    if (!TwilioClient.instance) {
      TwilioClient.instance = new TwilioClient();
    }
    return TwilioClient.instance;
  }

  public getClient(): Twilio {
    return this.client;
  }
}

export const twilioClient = TwilioClient.getInstance();