const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = API_URL ? `${API_URL}${path}` : path;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : null;

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function register(username: string, email: string, password: string) {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

export async function getFeed(limit = 20, skip = 0) {
  return apiFetch(`/api/feed?limit=${limit}&skip=${skip}`);
}

export async function createPost(content: string, photos: string[] = []) {
  return apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ content, photos }),
  });
}

export async function likePost(postId: number | string) {
  return apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
}

export async function commentPost(postId: number | string, content: string) {
  return apiFetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getProfile(userId?: number | string) {
  if (userId) return apiFetch(`/api/profile/${userId}`);
  return apiFetch('/api/auth/me');
}

export async function updateProfile(updates: Record<string, any>) {
  return apiFetch('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function uploadPhoto(url: string, isProfile = false) {
  return apiFetch('/api/profile/photos', {
    method: 'POST',
    body: JSON.stringify({ url, isProfile }),
  });
}

export async function deletePhoto(photoId: number | string) {
  return apiFetch(`/api/profile/photos/${photoId}`, { method: 'DELETE' });
}

export async function getUserProfile(userId: number | string) {
  return apiFetch(`/api/profile/${userId}`);
}

export async function getConversations() {
  return apiFetch('/api/conversations');
}

export async function getMessages(userId: number | string) {
  return apiFetch(`/api/messages/${userId}`);
}

export async function markMessagesRead(userId: number | string) {
  return apiFetch(`/api/messages/${userId}/read`, { method: 'PATCH' });
}

export async function getCredits() {
  return apiFetch('/api/credits');
}

export async function purchaseCredits(amount: number) {
  return apiFetch('/api/credits/purchase', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function createCheckoutSession() {
  return apiFetch('/api/payment/create-checkout-session', { method: 'POST' });
}

export async function reportUser(reportedId: string, reason: string, description: string) {
  return apiFetch('/api/report', {
    method: 'POST',
    body: JSON.stringify({ reportedId, reason, description }),
  });
}
