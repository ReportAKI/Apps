export const API_SERVER_URL = import.meta.env.VITE_API_URL || '';

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const endpoint = url.startsWith('/') ? url : `/${url}`;
        return await window.fetch(`${API_SERVER_URL}${endpoint}`, options);
    }
};

export default apiServerClient;

export { apiServerClient };