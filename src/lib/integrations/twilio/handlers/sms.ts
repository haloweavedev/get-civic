// src/lib/integrations/twilio/handlers/sms.ts

import { prisma } from '@/lib/prisma';
import { TwilioSMSWebhookPayload } from '../types';
import { openai } from '@/lib/openai';
import { TWILIO_RESPONSE_PROMPT } from '@/lib/services/twilio/prompts';
import twilio from 'twilio';
import { logger } from '@/lib/integrations/utils';

const MessagingResponse = twilio.twiml.MessagingResponse;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function handleIncomingSMS(payload: TwilioSMSWebhookPayload) {
  try {
    // Get admin user - we use this for all Twilio communications
    const user = await prisma.user.findFirst({
      where: { 
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    // Create the original incoming communication
    const communication = await prisma.communication.create({
      data: {
        type: 'SMS',
        sourceId: payload.MessageSid,
        direction: 'INBOUND',
        subject: 'SMS Message',
        from: payload.From,
        content: payload.Body || '',
        metadata: {
          source: 'TWILIO',
          to: payload.To,
          timestamp: new Date().toISOString(),
          messageDetails: payload
        },
        status: 'PENDING',
        source: 'HUMAN',
        userId: user.id,
        // We can remove organizationId as it's optional in our schema
        isAutomatedResponse: false,
        excludeFromAnalysis: false
      }
    });

    logger.info('Incoming SMS stored', { 
      communicationId: communication.id,
      from: payload.From 
    });

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
          content: payload.Body || ''
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content?.trim();
    
    if (aiResponse) {
      // Create automated response communication
      const automatedResponse = await prisma.communication.create({
        data: {
          type: 'SMS',
          sourceId: `ai-response-${communication.id}`,
          direction: 'OUTBOUND',
          subject: 'AI Response',
          from: payload.To,
          content: aiResponse,
          metadata: {
            source: 'TWILIO',
            to: payload.From,
            timestamp: new Date().toISOString(),
            inResponseTo: communication.id
          },
          status: 'PROCESSED',
          source: 'AUTOMATED',
          userId: user.id,
          isAutomatedResponse: true,
          excludeFromAnalysis: true,
          parentCommunicationId: communication.id
        }
      });

      // Send the response via Twilio
      await twilioClient.messages.create({
        body: aiResponse,
        from: payload.To,
        to: payload.From
      });

      logger.info('AI response sent', {
        originalId: communication.id,
        responseId: automatedResponse.id
      });

      // Create TwiML response
      const twiml = new MessagingResponse();
      return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // If no AI response, send default acknowledgment
    const twiml = new MessagingResponse();
    twiml.message('Thank you for your message. We have received it and will review it promptly.');
    
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    logger.error('SMS handling error:', error);
    
    // Send error response to user
    const twiml = new MessagingResponse();
    twiml.message('We encountered an issue processing your message. Please try again later.');
    
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}