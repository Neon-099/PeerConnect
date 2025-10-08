const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function getAccessToken() {
	return localStorage.getItem('pc_access_token') || '';
}

export function storeSessionTokens({ access_token, refresh_token }) {
	if (access_token) localStorage.setItem('pc_access_token', access_token);
	if (refresh_token) localStorage.setItem('pc_refresh_token', refresh_token);
}

export async function api(path, { method = 'GET', body, token } = {}) {
	const headers = {
		'Content-Type': 'application/json', 
		'Accept' : 'application/json',
	 };
	const t = token || getAccessToken();
	if (t) headers.Authorization = `Bearer ${t}`;

	console.log('API Request:', { method, path, body, headers });

	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	console.log('API Response:', { status: res.status, statusText: res.statusText });

	const json = await res.json().catch(() => ({}));
	console.log('API Response JSON:', json);

	// Backend Response::success returns { success, message, data }
	if (!res.ok || json?.success === false) {
		const msg = json?.message || `Request failed (${res.status})`;
		throw new Error(msg);
	}
	return json?.data ?? json;
}