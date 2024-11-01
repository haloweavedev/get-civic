import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    console.log('Received webhook:', Object.fromEntries(body.entries()));
    
    return NextResponse.json({ 
      received: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}