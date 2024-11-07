// src/lib/integrations/twilio/sms/route.ts

import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { validateRequest } from 'twilio';
import { logger } from '@/lib/integrations/utils';

const MessagingResponse = twilio.twiml.MessagingResponse;

// Helper to get the stable production URL
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_URL || 'https://senate-insights.vercel.app';
};

export async function POST(req: Request) {
  try {
    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature') || '';
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/api/webhooks/twilio/sms`;

    const body = await req.formData();
    const params = Object.fromEntries(body.entries());

    // Validate the request
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      webhookUrl,
      params as Record<string, string>
    );

    if (!isValid) {
      logger.error('Invalid Twilio signature', {
        url: webhookUrl,
        signature
      });
      return new Response('Invalid signature', { status: 403 });
    }

    // Get admin user
    const user = await prisma.user.findFirst({
      where: { 
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    const { Body, From, MessageSid, To } = params as any;

    // Store incoming communication
    const communication = await prisma.communication.create({
      data: {
        type: 'SMS',
        sourceId: MessageSid,
        direction: 'INBOUND',
        subject: 'SMS Message',
        from: From,
        content: Body || '',
        metadata: {
          source: 'TWILIO',
          to: To,
          timestamp: new Date().toISOString()
        },
        status: 'PENDING',
        userId: user.id
      }
    });

    // Generate TwiML response
    const twiml = new MessagingResponse();
    twiml.message('Thank you for your message. We have received it and will review it promptly.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    logger.error('SMS webhook error:', error);
    const twiml = new MessagingResponse();
    twiml.message('We encountered an issue processing your message. Please try again later.');
    
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}