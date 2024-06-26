import type { BinaryLike, EncoderOptions, EncryptionOptions, SessionOptions } from './types';
import type { RequestEvent } from '@sveltejs/kit';
import type { MaybePromise } from '@sveltejs/kit';

export function expiresToMaxAge(
	expires: number,
	expires_in: 'days' | 'hours' | 'minutes' | 'seconds'
) {
	switch (expires_in) {
		case 'days':
			return expires * 24 * 60 * 60;
		case 'hours':
			return expires * 60 * 60;
		case 'minutes':
			return expires * 60;
		case 'seconds':
			return expires;
		default:
			return expires;
	}
}

export function maxAgeToDateOfExpiry(maxAge: number) {
	return new Date(Date.now() + maxAge * 1000);
}

export interface Secret {
	id: number;
	secret: BinaryLike;
}

export type NormalizedConfig = Omit<Required<SessionOptions>, 'cookie' | 'rolling' | 'secret'> & {
	cookie: Required<SessionOptions>['cookie'] & {
		maxAge: number;
	};
	rolling: number | boolean | undefined;
	secrets: Array<Secret>;
};

export function normalizeConfig(
	options: SessionOptions,
	isSecure: boolean = false
): NormalizedConfig {
	if (options.secret == null) {
		throw new Error('Please provide at least one secret');
	}

	const init = options.init ? options.init : () => ({});

	return {
		init,
		saveUninitialized: options?.saveUninitialized ?? false,
		key: options.key || 'kit.session',
		expires: options.expires ? options.expires : 7,
		expires_in: options.expires_in ? options.expires_in : 'days',
		cookie: {
			maxAge: expiresToMaxAge(options.expires || 7, options.expires_in || 'days'),
			httpOnly: options?.cookie?.httpOnly ?? true,
			sameSite: options?.cookie?.sameSite || 'lax',
			path: options?.cookie?.path || '/',
			domain: options?.cookie?.domain || undefined,
			secure: options?.cookie?.secure ?? isSecure
		},
		chunked: options?.chunked ?? false,
		rolling: options?.rolling ?? false,
		secrets: Array.isArray(options.secret) ? options.secret : [{ id: 1, secret: options.secret }],
		encoder: options?.encoder ?? JSON
	};
}
