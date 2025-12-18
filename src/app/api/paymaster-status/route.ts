import { NextResponse } from 'next/server';

export async function GET() {
  const paymasterUrl = process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 
                       'https://kora.devnet.lazorkit.com';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(paymasterUrl, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Any response means the service is reachable
    return NextResponse.json({ status: 'up', statusCode: response.status });
  } catch (error) {
    return NextResponse.json({ status: 'down', error: String(error) });
  }
}