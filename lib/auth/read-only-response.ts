// Une lecture de session concurrente ne doit pas remplacer le jeton emis
// par /csrf entre son chargement et la soumission du formulaire.
// Les cookies de session (rotation/deconnexion) restent intacts.
export function preserveCsrfCookieOnRead<T extends Response>(response: T): T {
  const cookies = response.headers.getSetCookie()
  const retained = cookies.filter((cookie) => !/^(?:__Host-)?authjs\.csrf-token=/.test(cookie))
  if (retained.length === cookies.length) return response
  response.headers.delete('set-cookie')
  for (const cookie of retained) response.headers.append('set-cookie', cookie)
  return response
}
