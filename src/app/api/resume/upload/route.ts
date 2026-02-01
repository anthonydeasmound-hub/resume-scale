import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentProxy } from "unpdf";
import { put } from "@vercel/blob";
import { queryOne, execute } from "@/lib/db";
import puppeteer, { Page } from "puppeteer";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Get document proxy for text extraction
    const pdf = await getDocumentProxy(buffer);

    // Extract text from all pages
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textParts.push(pageText);
    }

    const text = textParts.join("\n\n");

    // Try to extract profile photo using Puppeteer
    let photoUrl: string | null = null;

    try {
      // Get user for storing photo
      const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

      if (user) {
        const extractedPhoto = await extractPhotoFromPDF(Buffer.from(arrayBuffer));

        if (extractedPhoto) {
          // Upload to Vercel Blob
          const blob = await put(`photos/${user.id}_${Date.now()}.png`, extractedPhoto, {
            access: "public",
            contentType: "image/png",
          });

          // Update database with photo URL
          await execute(`
            UPDATE resumes
            SET profile_photo_path = $1, updated_at = NOW()
            WHERE user_id = $2
          `, [blob.url, user.id]);

          photoUrl = blob.url;
          console.log("Photo extracted and uploaded:", photoUrl);
        }
      }
    } catch (imageError) {
      // Image extraction failed, but text extraction succeeded
      console.error("Image extraction error (non-fatal):", imageError);
    }

    return NextResponse.json({ text, photoUrl });
  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}

// Extract profile photo from PDF using Puppeteer
async function extractPhotoFromPDF(pdfBuffer: Buffer): Promise<Buffer | null> {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Convert PDF buffer to base64 data URL
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Create HTML page that uses pdf.js to render the PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <canvas id="pdf-canvas"></canvas>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          async function renderPDF() {
            try {
              const pdf = await pdfjsLib.getDocument('${pdfDataUrl}').promise;
              const page = await pdf.getPage(1);

              const scale = 2; // Higher scale for better quality
              const viewport = page.getViewport({ scale });

              const canvas = document.getElementById('pdf-canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({ canvasContext: context, viewport }).promise;

              window.pdfRendered = true;
            } catch (e) {
              console.error('PDF render error:', e);
              window.pdfError = e.message;
            }
          }

          renderPDF();
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for PDF to render
    await page.waitForFunction(() => (window as unknown as { pdfRendered?: boolean; pdfError?: string }).pdfRendered || (window as unknown as { pdfRendered?: boolean; pdfError?: string }).pdfError, { timeout: 30000 });

    // Check if rendering succeeded
    const error = await page.evaluate(() => (window as unknown as { pdfError?: string }).pdfError);
    if (error) {
      console.log('PDF rendering failed:', error);
      await browser.close();
      return null;
    }

    // Get canvas dimensions
    const dimensions = await page.evaluate(() => {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement | null;
      if (!canvas) return { width: 0, height: 0 };
      return { width: canvas.width, height: canvas.height };
    });

    // Look for a photo in the typical locations (top-right corner or top-left sidebar)
    // Most resume photos are in one of these areas
    const photoRegions = [
      // Top-right corner (common for professional resumes)
      { x: dimensions.width * 0.75, y: 0, width: dimensions.width * 0.25, height: dimensions.height * 0.2 },
      // Top-left sidebar (common for two-column resumes)
      { x: 0, y: 0, width: dimensions.width * 0.35, height: dimensions.height * 0.25 },
      // Center-top (some layouts)
      { x: dimensions.width * 0.35, y: 0, width: dimensions.width * 0.3, height: dimensions.height * 0.15 },
    ];

    // Take screenshots of each region and look for one with face-like characteristics
    for (const region of photoRegions) {
      try {
        const screenshot = await page.screenshot({
          type: 'png',
          clip: {
            x: Math.round(region.x),
            y: Math.round(region.y),
            width: Math.round(region.width),
            height: Math.round(region.height),
          },
        });

        // Check if this region likely contains a photo (not just text/white space)
        const hasContent = await checkIfImageHasPhoto(page, region);

        if (hasContent) {
          await browser.close();
          return screenshot as Buffer;
        }
      } catch (e) {
        console.log('Error capturing region:', e);
      }
    }

    await browser.close();
    return null;
  } catch (error) {
    console.error('Puppeteer extraction error:', error);
    if (browser) await browser.close();
    return null;
  }
}

// Check if a region likely contains a photo (has significant color variance)
async function checkIfImageHasPhoto(page: Page, region: { x: number; y: number; width: number; height: number }): Promise<boolean> {
  try {
    const result = await page.evaluate((r) => {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) return false;

      const imageData = context.getImageData(
        Math.round(r.x),
        Math.round(r.y),
        Math.round(r.width),
        Math.round(r.height)
      );

      const data = imageData.data;
      let colorVariance = 0;
      let nonWhitePixels = 0;
      let skinTonePixels = 0;
      const sampleSize = Math.min(data.length / 4, 10000);
      const step = Math.max(1, Math.floor(data.length / 4 / sampleSize));

      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check for non-white pixels
        if (r < 250 || g < 250 || b < 250) {
          nonWhitePixels++;
        }

        // Check for skin tones (rough approximation)
        if (r > 100 && g > 60 && b > 40 && r > g && g > b && r - b < 100) {
          skinTonePixels++;
        }

        // Calculate color variance
        colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      }

      const totalSamples = sampleSize;
      const nonWhiteRatio = nonWhitePixels / totalSamples;
      const skinToneRatio = skinTonePixels / totalSamples;
      const avgVariance = colorVariance / totalSamples;

      // A photo typically has:
      // - Significant non-white pixels (> 20%)
      // - Some color variance (not uniform color)
      // - Possibly some skin tones
      return nonWhiteRatio > 0.2 && avgVariance > 10 && (skinToneRatio > 0.05 || avgVariance > 30);
    }, region);

    return result;
  } catch (e) {
    return false;
  }
}
