import { twilioClient } from '@/lib/integrations/twilio/client';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('Starting test call...');  // Add logging
  try {
    const call = await twilioClient.calls.create({
      url: "http://demo.twilio.com/docs/voice.xml",
      to: "+19298995822",
      from: "+14438430495"
    });
    
    console.log('Call created:', call.sid);  // Add logging
    
    return NextResponse.json({ 
      success: true, 
      callSid: call.sid 
    });
  } catch (error) {
    console.error('Call error:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { 
      status: 500 
    });
  }
}