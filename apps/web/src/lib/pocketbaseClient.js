import Pocketbase from 'pocketbase';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8090';

const pocketbaseClient = new Pocketbase(baseUrl);

export default pocketbaseClient;
export { pocketbaseClient };