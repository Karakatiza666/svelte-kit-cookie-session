import { aes_256_gcm } from '@noble/ciphers/webcrypto/aes';
import { randomBytes } from '@noble/ciphers/webcrypto/utils';
import {
	utf8ToBytes,
	hexToBytes,
	bytesToHex,
	bytesToUtf8,
	concatBytes
} from '@noble/ciphers/utils';
import type { BinaryLike, EncoderOptions } from './types';

export async function encrypt(
	key: Uint8Array,
	nonce: Uint8Array,
	data: any,
	encoder: EncoderOptions
) {
	const cipher = aes_256_gcm(key, nonce);
	const ciphertext = await cipher.encrypt(
		'stringify' in encoder ? utf8ToBytes(encoder.stringify(data)) : encoder.serialize(data)
	);
	return bytesToHex(concatBytes(nonce, ciphertext));
}

export async function decrypt(key: Uint8Array, encryptedString: string, encoder: EncoderOptions) {
	const ciphertext = hexToBytes(encryptedString);
	const nonce = ciphertext.subarray(0, 12);
	const ciphertextWithoutNonce = ciphertext.subarray(12);
	const cipher = aes_256_gcm(key, nonce);
	const bytes = await cipher.decrypt(ciphertextWithoutNonce);
	return 'parse' in encoder ? encoder.parse(bytesToUtf8(bytes)) : encoder.deserialize(bytes);
}

export function getKey(secret: BinaryLike) {
	if (typeof secret === 'string') {
		return utf8ToBytes(secret);
	}
	if (secret instanceof Uint8Array) {
		return secret;
	}
	if (secret instanceof Uint16Array) {
		return new Uint8Array(secret.buffer);
	}
	if (secret instanceof ArrayBuffer) {
		return new Uint8Array(secret);
	}
	if (secret instanceof Buffer) {
		return new Uint8Array(secret.buffer);
	}
	throw new Error('Invalid secret type');
}

export function generateNonce() {
	return randomBytes(12);
}
