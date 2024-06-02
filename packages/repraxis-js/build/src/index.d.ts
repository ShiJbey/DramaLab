export declare enum NodeType {
    VARIABLE = 0,
    SYMBOL = 1,
    INT = 2,
    FLOAT = 3,
    STRING = 4
}
export declare enum NodeCardinality {
    NONE = 0,
    ONE = 1,
    MANY = 2
}
export type NodeBindingsList = Map<string, INode>[];
export interface INode {
    GetNodeType(): NodeType;
    GetSymbol(): string;
    GetCardinality(): NodeCardinality;
    GetChildren(): INode[];
    GetParent(): INode | null;
    GetRawValue(): unknown;
    EqualTo(other: INode): boolean;
    NotEqualTo(other: INode): boolean;
    GreaterThanEqualTo(other: INode): boolean;
    GreaterThan(other: INode): boolean;
    LessThan(other: INode): boolean;
    LessThanEqualTo(other: INode): boolean;
    AddChild(node: INode): void;
    SetParent(node: INode | null): void;
    RemoveChild(symbol: string): boolean;
    GetChild(symbol: string): INode;
    HasChild(symbol: string): boolean;
    ClearChildren(): void;
    GetPath(): string;
    Copy(): INode;
}
export declare class NodeTypeError extends Error {
    constructor(message?: string);
}
export declare class NodeCardinalityError extends Error {
    constructor(message?: string);
}
export declare abstract class Node<T> implements INode {
    protected _parent: INode | null;
    protected _children: Map<string, INode>;
    protected _symbol: string;
    protected _value: T;
    protected _cardinality: NodeCardinality;
    constructor(symbol: string, value: T, cardinality: NodeCardinality);
    abstract GetNodeType(): NodeType;
    GetSymbol(): string;
    GetCardinality(): NodeCardinality;
    GetChildren(): INode[];
    GetParent(): INode | null;
    GetRawValue(): unknown;
    GetValue(): T;
    abstract EqualTo(other: INode): boolean;
    abstract NotEqualTo(other: INode): boolean;
    abstract GreaterThanEqualTo(other: INode): boolean;
    abstract GreaterThan(other: INode): boolean;
    abstract LessThan(other: INode): boolean;
    abstract LessThanEqualTo(other: INode): boolean;
    AddChild(node: INode): void;
    SetParent(node: INode | null): void;
    RemoveChild(symbol: string): boolean;
    GetChild(symbol: string): INode;
    HasChild(symbol: string): boolean;
    ClearChildren(): void;
    GetPath(): string;
    abstract Copy(): INode;
    ToString(): string;
}
export declare class FloatNode extends Node<number> {
    constructor(value: number, cardinality: NodeCardinality);
    GetNodeType(): NodeType;
    EqualTo(other: INode): boolean;
    NotEqualTo(other: INode): boolean;
    GreaterThanEqualTo(other: INode): boolean;
    LessThanEqualTo(other: INode): boolean;
    LessThan(other: INode): boolean;
    GreaterThan(other: INode): boolean;
    Copy(): INode;
}
export declare class IntNode extends Node<number> {
    constructor(value: number, cardinality: NodeCardinality);
    GetNodeType(): NodeType;
    EqualTo(other: INode): boolean;
    NotEqualTo(other: INode): boolean;
    GreaterThanEqualTo(other: INode): boolean;
    LessThanEqualTo(other: INode): boolean;
    LessThan(other: INode): boolean;
    GreaterThan(other: INode): boolean;
    Copy(): INode;
}
export declare class SymbolNode extends Node<string> {
    constructor(value: string, cardinality: NodeCardinality);
    GetNodeType(): NodeType;
    EqualTo(other: INode): boolean;
    NotEqualTo(other: INode): boolean;
    GreaterThanEqualTo(other: INode): boolean;
    LessThanEqualTo(other: INode): boolean;
    LessThan(other: INode): boolean;
    GreaterThan(other: INode): boolean;
    Copy(): INode;
}
export declare class VariableNode extends Node<string> {
    constructor(value: string, cardinality: NodeCardinality);
    GetNodeType(): NodeType;
    EqualTo(other: INode): boolean;
    NotEqualTo(other: INode): boolean;
    GreaterThanEqualTo(other: INode): boolean;
    LessThanEqualTo(other: INode): boolean;
    LessThan(other: INode): boolean;
    GreaterThan(other: INode): boolean;
    Copy(): INode;
}
export declare function HasVariables(sentence: string): boolean;
export declare function BindSentence(sentence: string, bindings: Map<string, INode>): string;
export declare function NodeFromString(token: string, cardinality: NodeCardinality): INode;
export declare function NodeFromAny(value: unknown): INode;
export declare function ParseSentence(sentence: string): INode[];
export declare class RePraxisDatabase {
    private _root;
    constructor();
    Insert(sentence: string): void;
    Assert(sentence: string): boolean;
    Delete(sentence: string): boolean;
    Clear(): void;
    GetRoot(): INode;
}
export declare class QueryState {
    success: boolean;
    bindings: Map<string, INode>[];
    constructor(success: boolean, bindings: Map<string, INode>[]);
    ToResult(): QueryResult;
}
export declare class QueryResult {
    private _success;
    private _bindings;
    constructor(success: boolean, results: Map<string, unknown>[]);
    get Success(): boolean;
    get Bindings(): Map<string, unknown>[];
    LimitToVars(variables: string[]): QueryResult;
}
export declare class QueryBindingContext {
    private _bindings;
    private _subtree;
    constructor(bindings: Map<string, INode>, subtree: INode);
    get Bindings(): Map<string, INode>;
    get SubTree(): INode;
}
export declare function Unify(database: RePraxisDatabase, sentence: string): Map<string, INode>[];
export declare function UnifyAll(database: RePraxisDatabase, state: QueryState, sentences: string[]): Map<string, INode>[];
export interface IQueryExpression {
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class AssertExpression implements IQueryExpression {
    private _statement;
    constructor(statement: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class EqualsExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class GreaterThanEqualToExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class GreaterThanExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class LessThanEqualToExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class LessThanExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class NotEqualExpression implements IQueryExpression {
    private _lhValue;
    private _rhValue;
    constructor(lhValue: string, rhValue: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class NotExpression implements IQueryExpression {
    private _statement;
    constructor(statement: string);
    Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}
export declare class DBQuery {
    private _expressions;
    constructor(expressions?: string[]);
    Where(expression: string): DBQuery;
    Run(db: RePraxisDatabase, bindings?: Record<string, unknown>[] | Record<string, unknown>): QueryResult;
}
//# sourceMappingURL=index.d.ts.map