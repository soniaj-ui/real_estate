export function safeNextPath(next: string | string[] | undefined): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    return next;
  }
  return '/';
}
