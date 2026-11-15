import axios from 'axios'
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})
export async function csrf() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
}
