// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for authenticated fetch requests
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    },
    credentials: 'include'
  });
  
  // If we get a 401, the token might be expired
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.reload(); // Force re-authentication
  }
  
  return response;
};