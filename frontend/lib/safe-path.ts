// Only same-site paths are allowed. Otherwise a link like /login?next=https://evil.example
// could send people to another website straight after they log in.
export function safeNextPath(next: string | string[] | undefined): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    return next;
  }
  return '/';
}
