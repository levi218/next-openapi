import { nextOpenapi } from '@next-openapi/next-openapi';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await nextOpenapi());
}
