'use client';

import { formatBytes } from '@/lib/utils';

type Case = { input: any; expected: string; digits?: number };

const cases: Case[] = [
  { input: 0, expected: '0 B' },
  { input: 1, expected: '1 B' },
  { input: 1023, expected: '1023 B' },
  { input: 1024, expected: '1.0 KB' },
  { input: 1536, expected: '1.5 KB' },
  { input: 1048576, expected: '1.0 MB' },
  { input: 123456789, expected: '117.7 MB' },
  { input: 1073741824, expected: '1.0 GB' },
  { input: null, expected: '' },
  { input: undefined, expected: '' },
];

export default function FormatBytesTestPage() {
  const results = cases.map((c) => {
    const actual = formatBytes(c.input as number, c.digits as any);
    const pass = actual === c.expected;
    if (!pass) {
      // eslint-disable-next-line no-console
      console.error('formatBytes test failed', { input: c.input, expected: c.expected, actual });
    }
    return { ...c, actual, pass };
  });

  const passed = results.every((r) => r.pass);

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">formatBytes Tests</h1>
        <p className={`mb-6 font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {passed ? 'All tests passed' : 'Some tests failed — see console'}
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 font-semibold text-gray-700">Input</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Expected</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Actual</th>
                <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-800">{String(r.input)}</td>
                  <td className="px-4 py-2 text-gray-600">{r.expected}</td>
                  <td className="px-4 py-2 text-gray-800">{r.actual}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-gray-500 text-xs">Open console for details on failures.</p>
      </div>
    </main>
  );
}

