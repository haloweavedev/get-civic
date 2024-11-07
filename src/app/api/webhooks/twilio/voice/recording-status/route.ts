// src/app/api/webhooks/twilio/voice/recording-status/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from 'twilio';
import { logger } from '@/lib/integrations/utils';

// Helper to get the stable production URL - ALWAYS use the main domain
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_URL || 'https://senate-insights.vercel.app';
};

export async function POST(req: Request) {
  try {
    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature') || '';
    const webhookUrl = `${getBaseUrl()}/api/webhooks/twilio/voice/recording-status`;
    
    const body = await req.formData();
    const params = Object.fromEntries(body.entries());

    // Validate the request with full URL
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      webhookUrl,
      params as Record<string, string>
    );

    if (!isValid) {
      logger.error('Invalid Twilio signature', { 
        webhookUrl, 
        signature,
        headers: Object.fromEntries(req.headers.entries())
      });
      return new Response('Invalid signature', { status: 403 });
    }

    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
      RecordingChannels,
      RecordingSource
    } = params as any;

    logger.info('Recording status update received', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      recordingUrl: RecordingUrl
    });

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

    // Get existing communication record
    const existingComm = await prisma.communication.findFirst({
      where: {
        sourceId: CallSid,
        userId: user.id
      }
    });

    if (!existingComm) {
      logger.error('Communication record not found', { CallSid });
      return new Response('Communication not found', { status: 404 });
    }

    // Merge existing metadata with new recording data
    const updatedMetadata = {
      ...existingComm.metadata,
      recordingSid: RecordingSid,
      recordingUrl: RecordingUrl,
      recordingStatus: RecordingStatus,
      recordingDuration: RecordingDuration,
      recordingChannels: RecordingChannels,
      recordingSource: RecordingSource,
      lastUpdated: new Date().toISOString()
    };

    // Update communication record
    await prisma.communication.update({
      where: {
        id: existingComm.id
      },
      data: {
        metadata: updatedMetadata,
        // Update status based on recording status
        status: RecordingStatus === 'completed' ? 'PROCESSED' : 'PROCESSING'
      }
    });

    logger.info('Recording status updated successfully', {
      CallSid,
      RecordingSid,
      status: RecordingStatus
    });

    // Return plain 200 response
    return new Response('', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    logger.error('Recording status webhook error:', error);
    return new Response('Error processing recording status', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}