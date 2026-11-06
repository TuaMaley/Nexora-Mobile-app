import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { ApiError, BASE_URL, authHeaders, session, setUnauthorizedHandlerRef } from './api';

/**
 * Calls the existing POST /api/self-service/employment-verification route, which returns the PDF bytes,
 * saves the file in the app's document folder and opens the native share/preview sheet (Files, Mail,
 * WhatsApp, Print…). The server records the letter in EmployeeHRRequest as it does on the web.
 */
export async function downloadVerificationLetter(): Promise<string> {
  // expo/fetch (WinterCG) returns real binary bodies; React Native's built-in fetch cannot reliably hand PDF bytes to the file system.
  const headers = await authHeaders();
  let res: Awaited<ReturnType<typeof expoFetch>>;
  try { res = await expoFetch(`${BASE_URL}/api/self-service/employment-verification`, { method: 'POST', headers }); }
  catch { throw new ApiError('No connection. Check your internet and try again.', 0); }
  if (res.status === 401) { await session.clear(); setUnauthorizedHandlerRef.current?.(); throw new ApiError('Your session has expired. Please sign in again.', 401); }
  if (!res.ok) {
    let msg = 'Unable to generate the verification letter';
    try { const d = await res.json(); if (d?.error) msg = d.error; } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || `Employment-Verification-${Date.now()}.pdf`;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 100) throw new ApiError('The server returned an empty document. Contact HR.', 500);
  if (Platform.OS === 'web') {
    // Browser: hand the PDF to the browser's own viewer / download manager.
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return url;
  }
  const dir = new Directory(Paths.document, 'letters');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, filename);
  if (file.exists) file.delete();
  file.write(bytes);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Employment verification letter', UTI: 'com.adobe.pdf' });
  return file.uri;
}
