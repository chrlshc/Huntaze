import type { API, FileInfo, JSCodeshift, ObjectExpression, CallExpression, Property } from "jscodeshift";

// Transforms: logger.info({ evt: "X", ... }) -> log.info("X", { ... })
// Notes:
// - Intentionally naive: only rewrites when first arg is an object literal with a string evt
// - Leaves non-matching calls untouched

export default function transformer(file: FileInfo, api: API) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(file.source);

  root
    .find(j.CallExpression, {
      callee: { type: 'MemberExpression', object: { type: 'Identifier', name: 'logger' } },
    })
    .forEach(path => {
      const call = path.value as CallExpression;
      const member = call.callee as any;
      const level = member?.property?.name;
      if (!['info', 'warn', 'error'].includes(level)) return;
      if (!call.arguments?.length) return;

      const firstArg = call.arguments[0] as any;
      if (firstArg?.type !== 'ObjectExpression') return;
      const obj = firstArg as ObjectExpression;
      const props = (obj.properties || []) as Property[];
      const evtProp = props.find((p: any) => p?.key?.name === 'evt' || p?.key?.value === 'evt');
      if (!evtProp) return;

      const evtValue = (evtProp as any).value;
      if (!evtValue || (evtValue.type !== 'Literal' && evtValue.type !== 'StringLiteral')) return;

      const restProps = props.filter((p: any) => p !== evtProp);
      const evtArg = evtValue;
      const objArg = j.objectExpression(restProps);

      const replacement = j.callExpression(
        j.memberExpression(j.identifier('log'), j.identifier(level)),
        restProps.length ? [evtArg, objArg] : [evtArg]
      );
      j(path).replaceWith(replacement);
    });

  return root.toSource({ quote: 'single' });
}

