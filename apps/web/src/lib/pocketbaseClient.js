import Pocketbase from 'pocketbase';

const pocketbaseClient = new Pocketbase('http://localhost:8090');

export default pocketbaseClient;
export { pocketbaseClient };