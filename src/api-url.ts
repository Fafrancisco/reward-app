/** Access tokens may only be sent to an explicitly configured HTTPS origin. */
export function apiOrigin(value: string | undefined): string {
 if (!value) throw new Error('Configura o endereço da API Vercel.');
 let parsed: URL;
 try { parsed = new URL(value); } catch { throw new Error('O endereço da API é inválido.'); }
 if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
  throw new Error('O endereço da API tem de ser uma origem HTTPS sem credenciais nem caminhos.');
 }
 return parsed.origin;
}
