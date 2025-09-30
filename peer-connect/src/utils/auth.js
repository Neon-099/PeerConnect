const API = import.meta.env.VITE_API_BASE;

export async function apiPost(path, body, token){
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`}: {})
        },
        body: JSON.stringify(body),
        credentials: 'include'
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

export async function apiGet(path, token) {
    const res = await fetch(`${API}${path}`, {
        headers: {
            ...(token ? {Authorization: `Bearer ${token}`} : {})
            },
        credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        if(!res.ok) throw new Error(data.message || 'Request failed');
        return data;
}

export const auth = {
    async login(email, password, role){
        return apiPost('/api/auth/login', {email, password, role});
    },
    async register(payload){
        return apiPost('/api/auth/register', payload);
    },
    async googleAuth(google_token, role = 'student'){
        return apiPost('/api/auth/googleAuth', {google_token, role});
    },
    async refresh(refresh_token){
        return apiPost('/api/auth/refresh', { refresh_token })
    },
    async logout(refresh_token){
        return apiPost('/api/auth/logout', {refresh_token});
    },
    async me(token) {
        return apiGet('/api/auth/profile')
    }
}

export function storeSession({access_token, refresh_token, user}){
    localStorage.setItem('pc_access', access_token);
    localStorage.setItem('pc_refresh', refresh_token);
    localStorage.setItem('pc_user', JSON.stringify(user));
}
export function getAccessToken(){
    return localStorage.getItem('pc_access');    
}

export function getRefreshToken(){
    return localStorage.getItem('pc_refresh');
}

export function getUser(){
    const s = localStorage.geItem('pc_user');
    try {return s ? JSON.parse(s) : null } catch {return null }
}

export function clearSession(){
    localStorage.removeItem('pc_access');
    localStorage.removeItem('pc_refresh');
    localStorage.removeItem('pc_user');
}
