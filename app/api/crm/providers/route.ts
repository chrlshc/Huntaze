import { NextResponse } from 'next/server';

export async function GET() {
  // Static list for now; can be extended when docs are available
  return NextResponse.json({
    providers: [
      {
        id: 'inflow',
        name: 'Inflow',
        auth: 'api_key',
        docs: null,
      },
      {
        id: 'supercreator',
        name: 'Supercreator',
        auth: 'api_key',
        docs: null,
      },
    ],
  });
}

