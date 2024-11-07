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

    console.log('Initializing Twilio client with:', { 
      accountSid: accountSid.substring(0, 6) + '...',  // Log only first 6 chars for security
      hasAuthToken: !!authToken
    });

    try {
      // Using API Key (SK) based authentication
      this.client = twilio(accountSid, authToken, {
        lazyLoading: true,  // Add this to prevent immediate validation
        accountSid: 'AC' + accountSid.substring(2)  // Convert SK to AC format
      });

      console.log('Twilio client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
      throw error;
    }
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