import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url')
  const token = searchParams.get('token')

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
  }

  try {
    // Fetch the file with authentication
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    // Forward range header for video streaming
    const range = request.headers.get('range')
    if (range) {
      headers['Range'] = range
    }

    const res = await fetch(url, { headers })

    if (!res.ok && res.status !== 206) {
      if (res.status === 404) {
        return new NextResponse('File not found', { status: 404 })
      }
      if (res.status === 416) {
        return new NextResponse('Range Not Satisfiable', { status: 416 })
      }
      return new NextResponse('Failed to fetch file', { status: res.status })
    }

    // Get content type
    const contentType = res.headers.get('Content-Type') || getContentType(url)
    const contentLength = res.headers.get('Content-Length')
    const contentRange = res.headers.get('Content-Range')

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function getContentType(url: string): string {
  if (/\.mp4$/i.test(url)) return 'video/mp4'
  if (/\.webm$/i.test(url)) return 'video/webm'
  if (/\.mkv$/i.test(url)) return 'video/x-matroska'
  if (/\.mp3$/i.test(url)) return 'audio/mpeg'
  if (/\.wav$/i.test(url)) return 'audio/wav'
  if (/\.flac$/i.test(url)) return 'audio/flac'
  if (/\.ogg$/i.test(url)) return 'audio/ogg'
  if (/\.aac$/i.test(url)) return 'audio/aac'
  return 'application/octet-stream'
}
