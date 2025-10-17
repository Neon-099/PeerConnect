const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function getAccessToken() {
	return localStorage.getItem('pc_access_token') || '';
}

export function storeSessionTokens(response) {
	//HANDLE DIFF RESPONSE STRUCTURES FROM BACKEND
	let accessToken = null;
	let refreshToken = null;
	let user = null;

	//EXTRACT TOKES FROM DIFF POSSIBLE LOCATION
	if(response.access_token ) {
		accessToken = response.access_token;
	}
	else if (response.data && response.data.access_token) {
		accessToken = response.data.access_token;
	}

	if(response.refresh_token) {
		refreshToken = response.refresh_token;
	}
	else if (response.data && response.data.refresh_token) {
		refreshToken = response.data.refresh_token;
	}

	if(response.user) {
		user = response.user;
	}
	else if (response.data && response.data.user) {
		user = response.data.user;
	}

	//STORE TOKENS 
	if(accessToken) {
		localStorage.setItem('pc_access_token', accessToken);
		console.log('Access token stored: ', accessToken);
	}
	if(refreshToken) {
		localStorage.setItem('pc_refresh_token', refreshToken);
		console.log('Refresh token stored: ', refreshToken);
	} 
	if(user) {
		localStorage.setItem('pc_user', JSON.stringify(user));
		console.log('User stored: ', user);
	}

	console.log('Token storage', {
		accessToken: accessToken ? 'Stored' : 'Not found',
		refreshToken: refreshToken ? 'Stored' : 'Not found',
		user: user ? 'Stored' : 'Not found',
		responseStructure: {
			hasAccessToken: !!response.access_token,
			hasDataAccessToken: !!(response.data && response.data.access_token),
			hasUser: !!response.user,
			hasDataUser: !!(response.data && response.data.user)
		}
	});
}

export async function api(path, { method = 'GET', body, token, isFormData = false } = {}) {
	const headers = {
		'Accept': 'application/json',
	};
	
	// Only set Content-Type for JSON requests
	if (!isFormData) {
		headers['Content-Type'] = 'application/json';
	}
	
	const t = token || getAccessToken();
	if (t) headers.Authorization = `Bearer ${t}`;

	console.log('API Request:', { method, path, body, headers, isFormData });

	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
	});

	console.log('API Response:', { status: res.status, statusText: res.statusText });

	// Add detailed response logging
	const responseText = await res.text();
	console.log('Raw response text:', responseText);
	console.log('Response text length:', responseText.length);

	let json;
	try {
		json = JSON.parse(responseText);
		console.log('Parsed JSON successfully:', json);
	} catch (parseError) {
		console.error('JSON parse error:', parseError);
		console.log('Response text that failed to parse:', responseText);
		json = {};
	}

	console.log('API Response JSON:', json);

	// Backend Response::success returns { success, message, data }
	if (!res.ok || json?.success === false) {
		const msg = json?.message || `Request failed (${res.status})`;
		throw new Error(msg);
	}

	//HANDLING BASED ON ENDPOINTS (since theyre both different)
	if(path.includes('/auth/forgotPassword') ||
		path.includes('/auth/verifyResetCode') ||
		path.includes('/auth/resetPassword')){
	 
		return json;
	}
	else if(path.includes('/auth/register')){
		return json ;
	}

	else {
		return json?.data !== undefined ? json.data : json;
	}
	
}

// Add convenience methods
export const apiClient = {
	async post(path, data, options = {}) {
		const result = await api(path, { method: 'POST', body: data, ...options });
		
		// If response contains profile_picture, ensure it's a full URL
		if (result && result.profile_picture && !result.profile_picture.startsWith('http')) {
		  result.profile_picture_url = `${API_BASE}/${result.profile_picture}`;
		}
		
		return result;
	  },
	
	async get(path, options = {}) {
		return api(path, { method: 'GET', ...options });
	},
	
	async put(path, data, options = {}) {
		return api(path, { method: 'PUT', body: data, ...options });
	},
	
	async delete(path, options = {}) {
		return api(path, { method: 'DELETE', ...options });
	}
};

export function getOptimizedImageUrl(url, options = {}) {
	if (!url) return null;
	
	const {
	  width = 300,
	  height = 300,
	  crop = 'fill',
	  gravity = 'face',
	  quality = 'auto',
	  format = 'auto'
	} = options;
  
	// If it's a Cloudinary URL, optimize it
	if (url.includes('cloudinary.com')) {
	  return url.replace(
		'/upload/',
		`/upload/w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}/`
	  );
	}
  
	return url;
  }