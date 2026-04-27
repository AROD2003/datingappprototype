import { supabase } from './supabase';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Uploads a photo to Supabase Storage using base64 data.
 * Returns the public URL, or null on failure.
 */
export async function uploadPhoto(userId: string, localUri: string, base64: string): Promise<string | null> {
	try {
		const filename = `${Date.now()}.jpg`;
		const path = `${userId}/${filename}`;

		const arrayBuffer = base64ToArrayBuffer(base64);

		const { error } = await supabase.storage
			.from('photos')
			.upload(path, arrayBuffer, {
				contentType: 'image/jpeg',
				upsert: false,
			});

		if (error) {
			console.warn('uploadPhoto error:', error.message);
			return null;
		}

		const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
		return urlData.publicUrl;
	} catch (e) {
		console.warn('[upload] exception:', e);
		return null;
	}
}

/** Returns true if the URI is a local device URI (needs uploading). */
export function isLocalUri(uri: string): boolean {
	return uri.startsWith('file://') || uri.startsWith('ph://') || uri.startsWith('content://');
}
