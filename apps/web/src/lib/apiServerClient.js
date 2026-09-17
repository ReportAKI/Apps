export const API_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiServerClient = {
    fetch: async (url, options = {}) => {
        // Καθαρίζει τυχόν διπλά slashes
        const endpoint = url.startsWith('/') ? url : `/${url}`;
        return await window.fetch(`${API_SERVER_URL}${endpoint}`, options);
    }
};

export default apiServerClient;

export { apiServerClient };