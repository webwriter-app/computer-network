// Local type stub for `@webwriter/lit`.
//
// The published package ships its implementation as untyped `.ts` source, which
// would otherwise be pulled into this project's `tsc --strict` program and
// report errors that belong to the dependency. This declaration mirrors the
// public surface the widget relies on. Runtime resolution still uses the real
// `@webwriter/lit/index.js`.

declare module '@webwriter/lit' {
    import { LitElement, PropertyDeclaration } from 'lit';

    export interface OptionDeclaration extends PropertyDeclaration {
        type?: unknown;
        label?: Record<string, string>;
        placeholder?: Record<string, string>;
        description?: Record<string, string>;
        multiline?: boolean;
        min?: number;
        max?: number;
        step?: number;
        pattern?: string;
        minlength?: number;
        maxlength?: number;
        multiple?: boolean;
        swatches?: string[];
        options?: { value: string; label?: Record<string, string>; description?: Record<string, string> }[];
    }

    export interface ActionDeclaration {
        label?: Record<string, string>;
        placeholder?: Record<string, string>;
        description?: Record<string, string>;
    }

    export function option<This extends LitElementWw, Return>(
        decl?: OptionDeclaration
    ): (
        target: ClassAccessorDecoratorTarget<This, Return>,
        context: ClassAccessorDecoratorContext<This, Return>
    ) => void;

    export function action<This extends LitElementWw, Args extends unknown[], Return>(
        decl?: ActionDeclaration
    ): (
        target: (this: This, ...args: Args) => Return,
        context:
            | ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
            | ClassAccessorDecoratorContext<This, Return>
    ) => unknown;

    export class LitElementWw extends LitElement {
        static scopedElements: Record<string, unknown>;
        static readonly options: Record<string, OptionDeclaration>;
        static readonly actions: Record<string, ActionDeclaration>;
        get dynamicOptions(): Record<string, OptionDeclaration>;
        get dynamicActions(): Record<string, ActionDeclaration>;
        protected localize: { getLocale: () => string; setLocale: (locale: string) => Promise<void> };
        accessor contentEditable: string;
        get lang(): string;
        set lang(value: string);
        /** @internal */
        _inTransaction: boolean;
        connectedCallback(): void;
    }
}
