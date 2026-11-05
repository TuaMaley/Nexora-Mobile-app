import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ApiError, ess } from './api';

/**
 * Calls the existing POST /api/self-service/employment-verification route, which returns the PDF bytes,
 * saves the file in the app's document folder and opens the native share/preview sheet (Files, Mail,
 * WhatsApp, Print…). The server records the letter in EmployeeHRRequest as it does on the web.
 */
export async function downloadVerificationLetter(): Promise<string> {
  const res = await ess.verificationLetter();
  if (!res.ok) {
    let msg = 'Unable to generate the verification letter';
    try { const d = await res.json(); if (d?.error) msg = d.error; } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || `Employment-Verification-${Date.now()}.pdf`;
  const blob = await res.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the PDF'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(blob);
  });
  const dir = new Directory(Paths.document, 'letters');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, filename);
  file.write(base64, { encoding: 'base64' });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Employment verification letter', UTI: 'com.adobe.pdf' });
  return file.uri;
}
