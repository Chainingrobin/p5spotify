export async function getPlaylist(playlistId: string, accessToken: string) {
  const res = await fetch(`/api/playlist/${encodeURIComponent(playlistId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Error fetching playlist: ${res.statusText}`);
  return res.json();
}
