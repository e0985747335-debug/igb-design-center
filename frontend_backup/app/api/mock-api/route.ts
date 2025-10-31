import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    uiux: 85,
    logistics: 70,
    product: 60,
    marketing: 50,
  };
  return NextResponse.json(data);
}
