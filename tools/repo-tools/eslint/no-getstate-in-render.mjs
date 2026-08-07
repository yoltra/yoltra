/**
 * Flags `useStore().getState()` read during a component's render body.
 *
 * @remarks
 * A store read through `getState()` subscribes to nothing. In a callback or an effect that is
 * exactly right — you want the value at the moment the thing happens, not a subscription. In the
 * render body it is almost always a mistake: the component renders once with that value and
 * never again, because nothing told it the value moved. It looks like it works, right up until
 * the state changes and the screen does not.
 *
 * This is the whole of what survived the ESLint plugin that was once planned. Its intended
 * flagship rule, `subscribe-what-you-read`, was going to catch a mismatch between the paths a
 * component declared and the ones its selector actually read — and that mismatch is now
 * structurally impossible, because the selector is handed only what it declared. One rule is not
 * a package, so it lives here and is wired into the repository's own config.
 *
 * ## What it does not do
 *
 * There is no type information involved. `getState` is matched on a value that came from a call
 * to `useStore`, either directly or through a variable in scope. A store obtained some other way
 * — passed as a prop, read from a module — is not flagged, because at that point the name alone
 * is not evidence.
 *
 * @module
 */

/**
 * Whether a function node is a component or a hook, rather than a callback.
 *
 * @remarks
 * Named by convention rather than detected, because the convention is the only signal available
 * without types, and React enforces it anyway: components are capitalised and hooks begin with
 * `use`. An anonymous function — the arrow passed to `useEffect`, an event handler assigned to a
 * lowercase name — is a callback, and reading `getState()` there is correct.
 */
function functionName(node, parent) {
  if (node.id?.name !== undefined) return node.id.name;
  if (parent?.type === "VariableDeclarator" && parent.id?.type === "Identifier") {
    return parent.id.name;
  }
  if (parent?.type === "Property" && parent.key?.type === "Identifier") return parent.key.name;
  return null;
}

function isComponentOrHook(name) {
  if (name === null) return false;
  return /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
}

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

/** @type {import('eslint').Rule.RuleModule} */
export const noGetStateInRender = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow reading useStore().getState() in a component's render body, where it subscribes to nothing",
    },
    schema: [],
    messages: {
      inRender:
        "`getState()` in a render body subscribes to nothing: this component renders once with " +
        "the value and never again. Use `useAtomicProp` or `useSelector` to read state you " +
        "render, and keep `getState()` for callbacks and effects.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    /** `true` when this expression is a call to `useStore`. */
    const isUseStoreCall = (node) =>
      node?.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "useStore";

    /** `true` when this identifier was bound to the result of `useStore()`. */
    const isStoreVariable = (node) => {
      if (node.type !== "Identifier") return false;
      const scope = sourceCode.getScope?.(node) ?? context.getScope();
      // Walk outward: the declaration is usually in the component's scope, while the reference
      // can be nested a block or two deeper.
      for (let current = scope; current !== null; current = current.upper) {
        const variable = current.variables.find((v) => v.name === node.name);
        if (variable === undefined) continue;
        return variable.defs.some(
          (def) => def.node?.type === "VariableDeclarator" && isUseStoreCall(def.node.init),
        );
      }
      return false;
    };

    /**
     * The function this node executes in, and whether that function is a component or a hook.
     *
     * @remarks
     * Only the *nearest* enclosing function matters. Crossing into any other function means the
     * read happens when that function is called rather than while rendering — which is the whole
     * distinction the rule is about.
     */
    const inRenderBody = (node) => {
      const ancestors = sourceCode.getAncestors?.(node) ?? context.getAncestors();
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const candidate = ancestors[i];
        if (!FUNCTION_TYPES.has(candidate.type)) continue;
        return isComponentOrHook(functionName(candidate, ancestors[i - 1]));
      }
      return false;
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression") return;
        if (callee.property.type !== "Identifier" || callee.property.name !== "getState") return;

        const object = callee.object;
        const fromStore = isUseStoreCall(object) || isStoreVariable(object);
        if (!fromStore) return;

        if (inRenderBody(node)) context.report({ node, messageId: "inRender" });
      },
    };
  },
};

/** The plugin object ESLint's flat config expects. */
export const yoltraPlugin = {
  rules: { "no-getstate-in-render": noGetStateInRender },
};
