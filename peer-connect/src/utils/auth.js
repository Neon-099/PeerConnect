import { api, storeSessionTokens, getAccessToken } from './api';

export const auth = {
	async register(payload) {
		// payload: { first_name, last_name, email, password, role: 'student' }
		const data = await api('/api/auth/register', { method: 'POST', body: payload });
		// data may or may not include tokens depending on backend; handle both cases safely
		if (data.access_token || data.refresh_token) {
			storeSessionTokens(data);
		}
		return data;
	},

	async login(email, password, role = 'student') {
		const data = await api('/api/auth/login', {
			method: 'POST',
			body: { email, password, role },
		});
		// Expecting { access_token, refresh_token, user, ... }
		console.log(data);
		storeSessionTokens(data);
		return data;
	},

	async googleAuth(google_token, role = 'student') {
		const data = await api('/api/auth/googleAuth', {
			method: 'POST',
			body: { google_token: google_token, role },
		});
		storeSessionTokens(data);
		return data ;
	},

	//REQUEST PASSWORD RESET
	async requestPasswordReset (email) {
		const data = await api('/api/auth/forgotPassword', {
			method: 'POST',
			body: {email}
		});
		return data;
	},

	async verifyResetCode (token, code) {
		const data = await api('/api/auth/verifyResetCode', {
			method: 'POST',
			body: {token, code}
		});
		return data;
	},

	async resetPassword (token, code, newPassword) {
		const data = await api('/api/auth/resetPassword', {
			method: 'POST',
			body: {token, code, password: newPassword}
		});
		return data;
	},

	async logout() {
		try {
			const refreshToken = localStorage.getItem('pc_refresh_token');
			if(refreshToken) {
				await api('/api/auth/logout', {
					method: 'POST',
					body: { refresh_token: refreshToken}
				});
			}
		}
		catch (err) {
			console.warn('Logout API call failed:', error);
		} finally {
			localStorage.removeItem('pc_access_token');
			localStorage.removeItem('pc_refresh_token');
			localStorage.removeItem('pc_user');
		}
	}

	
};

export function storeSession(result) {
	// Normalize both usages from your component:
	// - login uses full `res`
	// - signup/google uses `{ data }`
	const data = result;
	if (!data) return;

	if (data.access_token || data.refresh_token) {
		storeSessionTokens(data);
	}
	if (data.user) {
		localStorage.setItem('pc_user', JSON.stringify(data.user));
	}
}

export function clearSession() {
	localStorage.removeItem('pc_access_token');
	localStorage.removeItem('pc_refresh_token');
	localStorage.removeItem('pc_user');
}

export function getRemainingAttempts() {
	const attemptsMatch = errorMessage.match(`/(\d+) attempts remaining`);
	if(attemptsMatch) {
		return parseInt(attemptsMatch[1]);
	}
	return null;
}