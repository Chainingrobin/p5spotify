export async function getPlaylist(playlistId: string) {
  const res = await fetch(`/api/playlist?id=${encodeURIComponent(playlistId)}`);
  
  if (!res.ok) throw new Error(`Error fetching playlist: ${res.statusText}`);
  return res.json();
}
