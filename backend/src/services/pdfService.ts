import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface PlacementData {
  signature_id: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation?: number;
}

interface SignatureData {
  id: string;
  file_path: string;
}

/**
 * Sign a PDF by placing signatures at specified positions
 * @param documentPath - Path to the original PDF
 * @param placements - Array of signature placement data
 * @param signatures - Array of signature objects with file paths
 * @returns Path to the signed PDF
 */
export const signPDFWithPlacements = async (
  documentPath: string,
  placements: PlacementData[],
  signatures: SignatureData[]
): Promise<string> => {
  // Load the PDF
  const pdfBytes = fs.readFileSync(documentPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Create a map of signature ID to signature data for quick lookup
  const signatureMap = new Map<string, SignatureData>();
  signatures.forEach(sig => signatureMap.set(sig.id, sig));

  // Process each placement
  for (const placement of placements) {
    const signature = signatureMap.get(placement.signature_id);
    if (!signature) {
      console.warn(`Signature ${placement.signature_id} not found`);
      continue;
    }

    // Get the page (0-indexed in pdf-lib)
    const pageIndex = placement.page_number - 1;
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
      console.warn(`Invalid page number: ${placement.page_number}`);
      continue;
    }

    const page = pdfDoc.getPages()[pageIndex];

    // Load signature image
    const signatureImageBytes = fs.readFileSync(signature.file_path);
    let signatureImage;

    try {
      // Try PNG first (most common for transparent backgrounds)
      signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    } catch {
      try {
        // Fallback to JPEG
        signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
      } catch (error) {
        console.error(`Failed to embed signature image: ${error}`);
        continue;
      }
    }

    // Place signature on the page
    // PDF coordinates start from bottom-left, so we need to adjust y
    const pageHeight = page.getHeight();
    const adjustedY = pageHeight - placement.y_position - placement.height;

    page.drawImage(signatureImage, {
      x: placement.x_position,
      y: adjustedY,
      width: placement.width,
      height: placement.height,
      rotate: placement.rotation !== undefined ? degrees(placement.rotation) : undefined,
    });
  }

  // Save the signed PDF
  const signedPdfBytes = await pdfDoc.save();
  const signedFilename = `signed_${uuidv4()}.pdf`;
  const signedPath = path.join('uploads/signed', signedFilename);

  fs.writeFileSync(signedPath, signedPdfBytes);

  return signedPath;
};

/**
 * Module placeholder for future auto-placement feature
 * This would use AI/ML to automatically determine optimal signature positions
 */
export const autoPlaceSignatures = async (
  _documentPath: string,
  _signatureCount: number
): Promise<PlacementData[]> => {
  // TODO: Implement auto-placement logic
  // This could use computer vision to detect signature areas
  // or use predefined rules based on document type
  
  console.log('Auto-placement feature not yet implemented');
  return [];
};

/**
 * Module placeholder for canvas drawing feature
 * This would allow users to draw signatures directly in the browser
 */
export const saveCanvasSignature = async (
  _canvasDataUrl: string,
  _userId: string
): Promise<string> => {
  // TODO: Implement canvas signature saving
  // This would convert canvas data URL to image file
  // and save it as a signature
  
  console.log('Canvas drawing feature not yet implemented');
  return '';
};
