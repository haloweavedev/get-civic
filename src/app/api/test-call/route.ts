import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET(req: Request) {
  console.log('Starting test call...');

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  console.log('Account SID:', accountSid);
  console.log('Auth Token:', authToken);

  const twilioClient = twilio(accountSid, authToken);

  console.log('twilioClient:', twilioClient);
  console.log('twilioClient.calls:', twilioClient.calls);

  try {
    const call = await twilioClient.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to: '+919886639809', // Replace with the phone number you want to call
      from: process.env.TWILIO_PHONE_NUMBER!, // Your Twilio phone number
    });

    console.log('Call created:', call.sid);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
    });
  } catch (error) {
    console.error('Call error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        stack:
          process.env.NODE_ENV === 'development'
            ? (error as Error).stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}