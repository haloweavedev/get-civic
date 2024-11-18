// src/app/api/webhooks/twilio/sms/route.ts
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { TWILIO_RESPONSE_PROMPT } from '@/lib/services/twilio/prompts';

const MessagingResponse = twilio.twiml.MessagingResponse;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const POST = async (req: Request) => {
  try {
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

    // Send immediate acknowledgment
    const twiml = new MessagingResponse();
    twiml.message('Thank you for your message. We are processing it and will respond shortly.');

    // Process AI response in background
    processAIResponseAndSend(Body, From, To, communication.id).catch(console.error);

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    const twiml = new MessagingResponse();
    twiml.message('We encountered an issue. Please try again later.');
    
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
};

async function processAIResponseAndSend(
  messageBody: string,
  fromNumber: string,
  toNumber: string,
  communicationId: string
) {
  try {
    // Run analysis first
    await AIAnalysisService.analyzeCommunication(communicationId);

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TWILIO_RESPONSE_PROMPT
        },
        {
          role: "user",
          content: messageBody
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content?.trim();
    if (!aiResponse) return;

    // Send AI response as a new message
    await twilioClient.messages.create({
      body: aiResponse,
      from: toNumber,
      to: fromNumber
    });

    console.log('Sent AI response:', aiResponse);

    // Store outbound communication
    await prisma.communication.create({
      data: {
        type: 'SMS',
        sourceId: `ai-response-${communicationId}`,
        direction: 'OUTBOUND',
        subject: 'AI Response',
        from: toNumber,
        content: aiResponse,
        metadata: {
          source: 'TWILIO',
          to: fromNumber,
          timestamp: new Date().toISOString(),
          originalMessageId: communicationId
        },
        status: 'PROCESSED',
        userId: 'user_2oJI9IaKIpeRiMh8bSdFMhYWuKg' // Use your admin user ID
      }
    });

  } catch (error) {
    console.error('Failed to process AI response:', error);
  }
}