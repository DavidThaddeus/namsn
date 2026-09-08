import crypto from 'crypto';

const TOLERANCE_SECONDS = 300;

// Verifies a Bachs webhook delivery. Must be called with the RAW request
// body text — parsing to JSON first and re-serializing changes whitespace
// and byte order, which silently breaks the signature.
export function verifyBachsSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!timestampHeader || !signatureHeader) return false;

  const timestamp = parseInt(timestampHeader, 10);
  if (Number.isNaN(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const message = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex');

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
