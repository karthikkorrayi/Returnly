import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// GET /api/generate-qr?text=<url>
// Returns a PNG image encoding the given text. Generated on demand —
// nothing is stored, so there's no cache-invalidation problem if an
// item's qr_code_id ever needs to change.
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')

  if (!text) {
    return NextResponse.json({ error: 'Missing "text" parameter' }, { status: 400 })
  }

  try {
    const pngBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: 400,
      margin: 2,
    })
    
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        // Cache at the edge/browser since the same text always produces
        // the same QR image — safe to cache aggressively
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('QR generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}