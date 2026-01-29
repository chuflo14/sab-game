import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mediaPath = searchParams.get('path');

    if (!mediaPath) {
        return new NextResponse('Missing path parameter', { status: 400 });
    }

    // Security: Ensure we only serve from public/media/ads
    const normalizedPath = path.normalize(mediaPath).replace(/^(\.\.[\/\\])+/, '');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

    // We expect input like "/media/ads/filename.jpg"
    // So we join process.cwd() + "public" + cleanPath
    const fullPath = path.join(process.cwd(), 'public', cleanPath);

    // Verify it is inside the allowed directory
    const allowedDir = path.join(process.cwd(), 'public', 'media');
    if (!fullPath.startsWith(allowedDir)) {
        console.error('Access denied:', fullPath);
        return new NextResponse('Access denied', { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const mimeType = mime.getType(fullPath) || 'application/octet-stream';

    // Handle Range requests for video seeking (basic support)
    const range = request.headers.get('range');
    if (range && mimeType.startsWith('video/')) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(fullPath, { start, end });


        const stream = new ReadableStream({
            start(controller) {
                file.on('data', (chunk) => controller.enqueue(chunk));
                file.on('end', () => controller.close());
                file.on('error', (err) => controller.error(err));
            }
        });

        return new NextResponse(stream, {
            status: 206,
            headers: {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize.toString(),
                'Content-Type': mimeType,
            },
        });
    }

    // Standard Full Response
    const fileBuffer = fs.readFileSync(fullPath);
    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': mimeType,
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'no-store, must-revalidate', // Force fresh fetch
        },
    });
}
