import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => {
  return redirect('https://youtu.be/IT7zBJY3uB4', 307);
}