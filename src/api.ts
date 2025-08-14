const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function getPlaylist(playlistId: string) {
  const res = await fetch(`${BASE_URL}/api/playlist/${encodeURIComponent(playlistId)}`);
  
  if (!res.ok) throw new Error(`Error fetching playlist: ${res.statusText}`);
  return res.json();
}
