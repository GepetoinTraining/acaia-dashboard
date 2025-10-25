import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { ClientTokenPayload } from "./types";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env.local");
}

/**
 * Signs a new JWT token for a client visit.
 * This token will be embedded in the QR code.
 */
export function signClientToken(payload: ClientTokenPayload): string {
  // Token expires in 12 hours, long enough for a night
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

/**
 * Verifies a client's JWT token.
 * This will be used by the client-facing page.
 */
export function verifyClientToken(
  token: string
): ClientTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ClientTokenPayload;
    return payload;
  } catch (error) {
    console.error("Invalid client token:", error);
    return null;
  }
}

/**
 * Generates a QR code image as a Data URL.
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  try {
    const qrCodeUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000", // Black
        light: "#FFFFFF", // White
      },
    });
    return qrCodeUrl;
  } catch (err) {
    console.error("Failed to generate QR code", err);
    throw new Error("Failed to generate QR code");
  }
}
