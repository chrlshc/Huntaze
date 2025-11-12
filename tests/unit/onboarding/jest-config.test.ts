/**
 * Basic test to verify Jest configuration is working
 */

describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it('should support TypeScript', () => {
    const testFunction = (value: string): string => {
      return value.toUpperCase();
    };
    
    expect(testFunction('hello')).toBe('HELLO');
  });

  it('should support async/await', async () => {
    const asyncFunction = async (): Promise<number> => {
      return Promise.resolve(42);
    };
    
    const result = await asyncFunction();
    expect(result).toBe(42);
  });
});
