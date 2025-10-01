import { api, storeSessionTokens } from './api';

export const auth = {
	async register(payload) {
		// payload: { first_name, last_name, email, password, role: 'student' }
		const data = await api('/api/auth/register', { method: 'POST', body: payload });
		// data may or may not include tokens depending on backend; handle both cases safely
		if (data.access_token || data.refresh_token) {
			storeSessionTokens(data);
		}
		return { data };
	},

	async login(email, password, role = 'student') {
		const data = await api('/api/auth/login', {
			method: 'POST',
			body: { email, password, role },
		});
		// Expecting { access_token, refresh_token, user, ... }
		storeSessionTokens(data);
		return data;
	},

	async googleAuth(google_token, role = 'student') {
		const data = await api('/api/auth/googleAuth', {
			method: 'POST',
			body: { token: google_token, role },
		});
		storeSessionTokens(data);
		return { data };
	},
};

export function storeSession(result) {
	// Normalize both usages from your component:
	// - login uses full `res`
	// - signup/google uses `{ data }`
	const data = result?.data ?? result;
	if (!data) return;

	if (data.access_token || data.refresh_token) {
		storeSessionTokens(data);
	}
	if (data.user) {
		localStorage.setItem('pc_user', JSON.stringify(data.user));
	}
}