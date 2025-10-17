/**
 * jscodeshift codemod to replace next-auth session with server-auth helpers
 * Usage: jscodeshift -t codemods/next-auth-to-server-auth.js app/api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Replace import { getServerSession } from 'next-auth' with { requireUser } from '@/lib/server-auth'
  root
    .find(j.ImportDeclaration, { source: { value: 'next-auth' } })
    .forEach((path) => {
      const hasGSS = path.value.specifiers?.some((s) => s.imported?.name === 'getServerSession');
      if (hasGSS) {
        j(path).replaceWith(
          j.importDeclaration([j.importSpecifier(j.identifier('requireUser'))], j.literal('@/lib/server-auth'))
        );
      }
    });

  // Replace getServerSession() -> requireUser()
  root
    .find(j.CallExpression, { callee: { name: 'getServerSession' } })
    .replaceWith(() => j.callExpression(j.identifier('requireUser'), []));

  // Rename const session = await requireUser() -> const user = await requireUser()
  root
    .find(j.VariableDeclarator, {
      id: { name: 'session' },
      init: { callee: { name: 'requireUser' } },
    })
    .forEach((p) => {
      p.value.id = j.identifier('user');
    });

  // naive session.user -> user
  root
    .find(j.MemberExpression, { object: { name: 'session' }, property: { name: 'user' } })
    .forEach((p) => {
      j(p).replaceWith(j.identifier('user'));
    });

  return root.toSource();
}

