// src/app/api/webhooks/twilio/route.ts
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
const MessagingResponse = twilio.twiml.MessagingResponse;

export async function POST(req: Request) {
  try {
    // Get admin user
    const user = await prisma.user.findFirst({
      where: { 
        email: '3advanceinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());
    const { Body, From, MessageSid, To } = payload as any;

    // Store incoming communication
    const communication = await prisma.communication.create({
      data: {
        type: 'SMS',
        sourceId: MessageSid,
        direction: 'INBOUND',
        subject: 'SMS Message',
        from: From,
        content: Body,
        metadata: {
          source: 'TWILIO',
          to: To,
          timestamp: new Date().toISOString()
        },
        status: 'PENDING',
        userId: user.id
      }
    });

    // Trigger analysis
    await AIAnalysisService.analyzeCommunication(communication.id);

    // Generate response
    const twiml = new MessagingResponse();
    twiml.message('Thank you for your message. We have received it and will review it promptly.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    const twiml = new MessagingResponse();
    twiml.message('We encountered an issue processing your message. Please try again later.');
    
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}