// Minimal JSON logger proxying to console. Replace with pino/datadog as needed.
const serialize = (o: any) => {
  try {
    return JSON.stringify(o);
  } catch {
    return String(o);
  }
};

const base = {
  info: (o: any) => console.log(serialize(o)),
  warn: (o: any) => console.warn(serialize(o)),
  error: (o: any) => console.error(serialize(o)),
};

export default base;

