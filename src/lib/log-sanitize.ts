export const mask = (s?: string) =>
  s
    ?.replace(/\b[A-Fa-f0-9_]{24,}\b/g, '***')
    ?.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '***')
    ?.replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, 'Bearer ***');

export const redactObj = <T extends Record<string, any>>(o: T): T =>
  JSON.parse(
    JSON.stringify(o, (_, v) => (typeof v === 'string' ? mask(v) : v))
  );

