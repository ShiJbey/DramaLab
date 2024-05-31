export enum NodeType {
	VARIABLE = 0,
	SYMBOL,
	INT,
	FLOAT,
	STRING,
}

export enum NodeCardinality {
	NONE = 0,
	ONE,
	MANY
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

export class NodeTypeError extends Error {
	constructor(message?: string) {
		super(message);
	}
}

export class NodeCardinalityError extends Error {
	constructor(message?: string) {
		super(message);
	}
}

export abstract class Node<T> implements INode {

	protected _parent: INode | null;
	protected _children: Map<string, INode>;
	protected _symbol: string;
	protected _value: T;
	protected _cardinality: NodeCardinality;

	constructor(symbol: string, value: T, cardinality: NodeCardinality) {
		this._parent = null;
		this._children = new Map();
		this._symbol = symbol;
		this._value = value;
		this._cardinality = cardinality;
	}

	abstract GetNodeType(): NodeType;
	GetSymbol(): string { return this._symbol; }
	GetCardinality(): NodeCardinality { return this._cardinality; }
	GetChildren(): INode[] { return [...this._children.values()]; }
	GetParent(): INode | null { return this._parent; }
	GetRawValue(): unknown { return this._value; }
	GetValue(): T { return this._value; }

	abstract EqualTo(other: INode): boolean;
	abstract NotEqualTo(other: INode): boolean;
	abstract GreaterThanEqualTo(other: INode): boolean;
	abstract GreaterThan(other: INode): boolean;
	abstract LessThan(other: INode): boolean;
	abstract LessThanEqualTo(other: INode): boolean;

	AddChild(node: INode): void {
		if (this._cardinality === NodeCardinality.NONE) {
			throw new Error(
				"Cannot add child to node with cardinality NONE"
			);
		}

		if (this._cardinality === NodeCardinality.ONE && this._children.size >= 1) {
			throw new Error(
				"Cannot add additional child to node with cardinality ONE"
			);
		}

		this._children.set(node.GetSymbol(), node);
		node.SetParent(this);
	}

	SetParent(node: INode | null): void {
		if (this._parent !== null && node !== null) {
			throw new Error("Node already has a parent.");
		}

		this._parent = node;
	}

	RemoveChild(symbol: string): boolean {

		const child = this._children.get(symbol);

		if (child !== undefined) {

			child.SetParent(null);

			return this._children.delete(symbol);
		}

		return false;
	}

	GetChild(symbol: string): INode {
		const child = this._children.get(symbol);

		if (child !== undefined) {
			return child;
		}

		throw new Error(`No child node found with symbol: ${symbol}`);
	}

	HasChild(symbol: string): boolean {
		return this._children.has(symbol);
	}

	ClearChildren(): void {
		for (const [, child] of this._children) {
			child.SetParent(null);
			child.ClearChildren();
		}

		this._children.clear();
	}


	GetPath(): string {
		if (this._parent === null || this._parent.GetSymbol() === "root") {
			return this._symbol;
		}
		else {
			const parentCardinalityOp = this._parent.GetCardinality() === NodeCardinality.ONE ? "!" : ".";
			return this._parent.GetPath() + parentCardinalityOp + Symbol;
		}
	}

	abstract Copy(): INode;

	ToString(): string { return this._symbol; }
}

export class FloatNode extends Node<number> {

	constructor(value: number, cardinality: NodeCardinality) {
		super(value.toPrecision(3), value, cardinality);
	}

	GetNodeType(): NodeType {
		return NodeType.FLOAT;
	}

	EqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return false;

		return this._value === (other as FloatNode).GetValue();
	}

	NotEqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return true;

		return this._value != (other as FloatNode).GetValue();
	}

	GreaterThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value >= (other as FloatNode).GetValue();
		}

		return this._value >= (other as IntNode).GetValue();
	}

	LessThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value <= (other as FloatNode).GetValue();
		}

		return this._value <= (other as IntNode).GetValue();
	}

	LessThan(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value < (other as FloatNode).GetValue();
		}

		return this._value < (other as IntNode).GetValue();
	}

	GreaterThan(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value > (other as FloatNode).GetValue();
		}

		return this._value > (other as IntNode).GetValue();
	}

	Copy(): INode {
		return new FloatNode(this._value, this._cardinality);
	}
}

export class IntNode extends Node<number> {

	constructor(value: number, cardinality: NodeCardinality) {
		super(Math.trunc(value).toString(), Math.trunc(value), cardinality);
	}

	GetNodeType(): NodeType {
		return NodeType.INT;
	}

	EqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return false;

		return this._value === (other as IntNode).GetValue();
	}

	NotEqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return true;

		return this._value != (other as IntNode).GetValue();
	}

	GreaterThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value >= (other as FloatNode).GetValue();
		}

		return this._value >= (other as IntNode).GetValue();
	}

	LessThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value <= (other as FloatNode).GetValue();
		}

		return this._value <= (other as IntNode).GetValue();
	}

	LessThan(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value < (other as FloatNode).GetValue();
		}

		return this._value < (other as IntNode).GetValue();
	}

	GreaterThan(other: INode): boolean {
		if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		if (other.GetNodeType() === NodeType.FLOAT) {
			return this._value > (other as FloatNode).GetValue();
		}

		return this._value > (other as IntNode).GetValue();
	}

	Copy(): INode {
		return new IntNode(this._value, this._cardinality);
	}
}

export class SymbolNode extends Node<string> {

	constructor(value: string, cardinality: NodeCardinality) {
		super(value, value, cardinality);
	}

	GetNodeType(): NodeType {
		return NodeType.SYMBOL;
	}

	EqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return false;

		return this._value === (other as SymbolNode).GetValue();
	}

	NotEqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return true;

		return this._value != (other as SymbolNode).GetValue();
	}

	GreaterThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != this.GetNodeType()) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result >= 0;
	}

	LessThanEqualTo(other: INode): boolean {
		if (other.GetNodeType() != this.GetNodeType()) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result <= 0;
	}

	LessThan(other: INode): boolean {
		if (other.GetNodeType() != this.GetNodeType()) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result < 0;
	}

	GreaterThan(other: INode): boolean {
		if (other.GetNodeType() != this.GetNodeType()) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result > 0;
	}

	Copy(): INode {
		return new SymbolNode(this._value, this._cardinality);
	}
}

export class VariableNode extends Node<string> {

	constructor(value: string, cardinality: NodeCardinality) {
		super(value, value, cardinality);
	}

	GetNodeType(): NodeType {
		return NodeType.VARIABLE;
	}

	EqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return false;

		return this._value === (other as VariableNode).GetValue();
	}

	NotEqualTo(other: INode): boolean {
		if (other.GetNodeType() !== this.GetNodeType()) return true;

		return this._value != (other as VariableNode).GetValue();
	}

	GreaterThanEqualTo(other: INode): boolean {
		throw new NodeTypeError(
			`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
		);
	}

	LessThanEqualTo(other: INode): boolean {
		throw new NodeTypeError(
			`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
		);
	}

	LessThan(other: INode): boolean {
		throw new NodeTypeError(
			`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
		);
	}

	GreaterThan(other: INode): boolean {
		throw new NodeTypeError(
			`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`
		);
	}

	Copy(): INode {
		return new VariableNode(this._value, this._cardinality);
	}
}

export function HasVariables(sentence: string): boolean {
	return ParseSentence(sentence)
		.filter(n => n.GetNodeType() === NodeType.VARIABLE)
		.length > 0;
}

export function BindSentence(sentence: string, bindings: Map<string, INode>): string {
	const nodes = ParseSentence(sentence);

	let finalSentence = "";

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];

		if (node.GetNodeType() === NodeType.VARIABLE) {
			const boundNode = bindings.get(node.GetSymbol());
			if (boundNode !== undefined) {
				finalSentence += boundNode.GetSymbol();
			}
			else {
				finalSentence += node.GetSymbol();
			}
		}
		else {
			finalSentence += node.GetSymbol();
		}

		if (i < nodes.length - 1) {
			finalSentence += node.GetCardinality() == NodeCardinality.ONE ? "!" : ".";
		}
	}

	return finalSentence;
}

export function NodeFromString(token: string, cardinality: NodeCardinality): INode {
	if (token[0] == "?") {
		return new VariableNode(token, cardinality);
	}
	const numericValue = parseFloat(token);

	if (isNaN(numericValue)) {
		return new SymbolNode(token, cardinality);
	}

	if (Number.isInteger(numericValue)) {
		return new IntNode(numericValue, cardinality);
	}
	else {
		return new FloatNode(numericValue, cardinality);
	}
}

export function NodeFromAny(value: unknown): INode {
	const numericValue = Number(value);

	if (!isNaN(numericValue)) {
		if (Number.isInteger(numericValue)) {
			return new IntNode(numericValue, NodeCardinality.NONE);
		}
		else {
			return new FloatNode(numericValue, NodeCardinality.NONE);
		}
	}

	else if (typeof value === "string") {
		return new SymbolNode(value as string, NodeCardinality.NONE);
	}

	throw new Error(`Cannot convert (${value}) of type ${typeof value} to node`);
}

export function ParseSentence(sentence: string): INode[] {
	const nodes: INode[] = []

	let currentToken = ""
	let processingLiteral = false

	for (const char of sentence) {
		if (char === "[") {
			processingLiteral = true
		}
		else if (char === "]") {
			processingLiteral = false
		}
		else if ((char === "!" || char === ".") && !processingLiteral) {
			const cardinality = (char === "!") ? NodeCardinality.ONE : NodeCardinality.MANY;

			nodes.push(NodeFromString(currentToken, cardinality))

			currentToken = ""
		}
		else {
			currentToken += char
		}
	}

	if (processingLiteral) {
		throw new Error(`Could not find closing ']' for value in: '${sentence}'`)
	}

	nodes.push(NodeFromString(currentToken, NodeCardinality.MANY))

	return nodes
}

export class RePraxisDatabase {
	private _root: INode;

	constructor() {
		this._root = new SymbolNode("root", NodeCardinality.MANY);
	}

	Insert(sentence: string): void {
		const nodes = ParseSentence(sentence);

		let subtree = this._root;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i].Copy();

			if (node.GetNodeType() == NodeType.VARIABLE) {
				throw new Error(
					`Found variable ${node.GetSymbol()} in sentence '(${sentence})'. `
					+ "Sentence cannot contain variables when inserting a value."
				);
			}

			if (!subtree.HasChild(node.GetSymbol())) {
				if (subtree.GetCardinality() == NodeCardinality.ONE) {
					// Replace the existing child
					subtree.ClearChildren();
				}

				subtree.AddChild(node);
				subtree = node;
			}
			else {
				// We need to get the existing node, check cardinalities, and establish new
				// nodes
				const existingNode = subtree.GetChild(node.GetSymbol());

				if (existingNode.GetCardinality() != node.GetCardinality()) {
					throw new NodeCardinalityError(
						`Cardinality mismatch on ${node.GetSymbol()} in sentence '${sentence}'.`
					);
				}

				subtree = existingNode;
			}
		}
	}

	Assert(sentence: string): boolean {
		const nodes = ParseSentence(sentence);

		let currentNode = this._root;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];

			if (node.GetNodeType() == NodeType.VARIABLE) {
				throw new NodeTypeError(
					`Found variable ${node.GetSymbol()} in sentence.`
					+ "Sentence cannot contain variables when retrieving a value."
				);
			}

			// Return early if there is not a corresponding node in the database
			if (!currentNode.HasChild(node.GetSymbol())) return false;

			// We can stop iterating since we don't care about the cardinality of the last node
			if (i == nodes.length - 1) return true;

			// Update the current node for a cardinality check
			currentNode = currentNode.GetChild(node.GetSymbol());

			// The cardinalities of all intermediate nodes need to match
			if (currentNode.GetCardinality() != node.GetCardinality()) return false;
		}

		return true;
	}

	Delete(sentence: string): boolean {
		const nodes = ParseSentence(sentence);

		let currentNode = this._root;

		// Loop until we get to the second to last node
		for (let i = 0; i < nodes.length - 1; i++) {
			const node = nodes[i];
			currentNode = currentNode.GetChild(node.GetSymbol());
		}

		// Get a reference to the final node in the sentence
		const lastToken = nodes[nodes.length - 1];

		// Remove the child
		return currentNode.RemoveChild(lastToken.GetSymbol());
	}

	Clear(): void {
		this._root.ClearChildren();
	}

	GetRoot(): INode { return this._root; }
}

export class QueryState {
	public success: boolean;
	public bindings: Map<string, INode>[];

	constructor(success: boolean, bindings: Map<string, INode>[]) {
		this.success = success;
		this.bindings = bindings.map(b => new Map(b));
	}

	ToResult(): QueryResult {
		if (!this.success) return new QueryResult(false, []);

		const results: Map<string, unknown>[] = [];

		for (let i = 0; i < this.bindings.length; i++) {
			results[i] = new Map<string, object>();
			for (const [varName, node] of this.bindings[i]) {
				results[i].set(varName, node.GetRawValue());
			}
		}

		return new QueryResult(true, results);
	}
}

export class QueryResult {
	private _success: boolean;
	private _bindings: Map<string, unknown>[];


	constructor(success: boolean, results: Map<string, unknown>[]) {
		this._success = success;
		this._bindings = results.map(entry => new Map(entry));
	}

	get Success(): boolean { return this._success; }
	get Bindings(): Map<string, unknown>[] { return this._bindings; }

	LimitToVars(variables: string[]): QueryResult {
		if (!this._success) {
			return new QueryResult(false, []);
		}

		if (variables.length == 0) {
			return new QueryResult(true, []);
		}

		const filteredResults: Map<string, unknown>[] = [];

		for (let i = 0; i < this._bindings.length; i++) {
			filteredResults[i] = new Map<string, unknown>();

			for (const varName of variables) {
				filteredResults[i].set(varName, this._bindings[i].get(varName));
			}
		}

		return new QueryResult(true, filteredResults);
	}
}

export class QueryBindingContext {
	private _bindings: Map<string, INode>;
	private _subtree: INode;

	constructor(bindings: Map<string, INode>, subtree: INode) {
		this._bindings = bindings;
		this._subtree = subtree;
	}

	get Bindings(): Map<string, INode> {
		return this._bindings;
	}

	get SubTree(): INode {
		return this._subtree;
	}
}

export function Unify(database: RePraxisDatabase, sentence: string): Map<string, INode>[] {
	let unified: QueryBindingContext[] = [
		new QueryBindingContext(new Map(), database.GetRoot())
	];

	const tokens = ParseSentence(sentence);

	for (const token of tokens) {
		const nextUnified: QueryBindingContext[] = [];

		for (const entry of unified) {
			for (const child of entry.SubTree.GetChildren()) {
				if (token.GetNodeType() == NodeType.VARIABLE) {
					const unification = new QueryBindingContext(
						new Map(entry.Bindings), child
					);

					unification.Bindings.set(token.GetSymbol(), child);

					nextUnified.push(unification);
				}
				else {
					if (token.GetSymbol() == child.GetSymbol()) {
						nextUnified.push(new QueryBindingContext(entry.Bindings, child));
					}
				}
			}
		}

		unified = nextUnified;
	}

	return unified
		.map(entry => entry.Bindings)
		.filter(binding => binding.size > 0)
}

export function UnifyAll(database: RePraxisDatabase, state: QueryState, sentences: string[]): Map<string, INode>[] {
	let possibleBindings = [...state.bindings];


	for (const sentence of sentences) {
		const iterativeBindings: Map<string, INode>[] = [];
		const newBindings: Map<string, INode>[] = Unify(database, sentence);

		if (possibleBindings.length === 0) {
			for (const binding of newBindings) {
				iterativeBindings.push(new Map(binding));
			}
		} else {
			for (const oldBinding of possibleBindings) {
				for (const binding of newBindings) {
					const newKeys = [...binding.keys()].filter(k => !oldBinding.has(k));
					const oldKeys = [...binding.keys()].filter(k => oldBinding.has(k));
					const existsIncompatibleKey = oldKeys.some(k => {
						const oldVal = oldBinding.get(k)
						const newVal = binding.get(k)

						if (oldVal !== undefined && newVal !== undefined) {
							return !oldVal.EqualTo(newVal)
						}

						throw new Error("Missing value in binding map.")
					});

					if (existsIncompatibleKey) {
						continue;
					} else {
						const nextUnification: Map<string, INode> = new Map(oldBinding);

						for (const k of newKeys) {
							const node = binding.get(k)
							if (node !== undefined) {
								nextUnification.set(k, node);
							}
						}

						iterativeBindings.push(nextUnification);
					}
				}
			}
		}

		possibleBindings = iterativeBindings;
	}

	return possibleBindings.filter(bindings => bindings.size > 0);
}

export interface IQueryExpression {
	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}

export class AssertExpression implements IQueryExpression {

	private _statement: string;

	constructor(statement: string) {
		this._statement = statement;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		if (HasVariables(this._statement)) {
			const bindings = UnifyAll(database, state, [this._statement]);

			if (bindings.length == 0) return new QueryState(false, []);

			const validBindings = bindings
				.filter(
					(binding) => {
						return database.Assert(
							BindSentence(this._statement, binding)
						);
					}
				);

			if (validBindings.length == 0) return new QueryState(false, []);

			return new QueryState(true, validBindings);
		}

		if (!database.Assert(this._statement)) return new QueryState(false, []);

		return state;
	}
}

export class EqualsExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.EqualTo(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class GreaterThanEqualToExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.GreaterThanEqualTo(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class GreaterThanExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.GreaterThan(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class LessThanEqualToExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.LessThanEqualTo(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class LessThanExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.LessThan(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class NotEqualExpression implements IQueryExpression {
	private _lhValue: string;
	private _rhValue: string;

	constructor(lhValue: string, rhValue: string) {
		this._lhValue = lhValue;
		this._rhValue = rhValue;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = ParseSentence(this._lhValue);
		const rhNodes = ParseSentence(this._rhValue);

		if (lhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._lhValue} has too many parts.`
			);
		}

		if (rhNodes.length > 1) {
			throw new Error(
				"Comparator expression may only be single variables, symbols, or constants. "
				+ `${this._rhValue} has too many parts.`
			);
		}

		// If no bindings are found and at least one of the values is a variables,
		// then the query has failed.
		if (
			state.bindings.length == 0
			&& (HasVariables(this._lhValue) || HasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = ParseSentence(
					BindSentence(this._lhValue, binding)
				)[0];

				const rightNode = ParseSentence(
					BindSentence(this._rhValue, binding)
				)[0];

				return leftNode.NotEqualTo(rightNode);
			});

		if (validBindings.length == 0) {
			return new QueryState(false, []);
		}

		return new QueryState(true, validBindings);
	}
}

export class NotExpression implements IQueryExpression {
	private _statement: string;

	constructor(statement: string) {
		this._statement = statement;
	}

	Evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		if (HasVariables(this._statement)) {
			// If there are no existing bindings, then this is the first statement in the query
			// or no previous statements contained variables.
			if (state.bindings.length == 0) {
				// We need to find bindings for all of the variables in this expression
				const bindings = UnifyAll(database, state, [this._statement]);

				// If bindings for variables are found then we know this expression fails
				// because we want to ensure that the statement is never true
				if (bindings.length > 0) return new QueryState(false, []);

				// Continue the query.
				return state;
			}

			// If we have existing bindings, we need to filter the existing bindings
			const validBindings = state.bindings
				.filter(
					(binding) => {
						// Try to build a new sentence from the bindings and the expression's
						// statement.
						const sentence = BindSentence(this._statement, binding);

						if (HasVariables(sentence)) {
							// Treat the new sentence like its first in the query
							// and do a sub-unification, swapping out the state for an empty
							// one without existing bindings
							const scopedBindings = UnifyAll(
								database,
								new QueryState(true, []),
								[sentence]
							);

							// If any of the remaining variables are bound in the scoped
							// bindings, then the entire binding fails
							if (scopedBindings.length > 0) return false;

							return true;
						}

						return !database.Assert(sentence);
					}
				);

			if (validBindings.length == 0) return new QueryState(false, []);

			return new QueryState(true, validBindings);
		}

		if (database.Assert(this._statement)) return new QueryState(false, []);

		return state;
	}
}

export class DBQuery {

	private _expressions: string[];

	constructor(expressions?: string[]) {
		this._expressions = [];
		if (expressions !== undefined) {
			this._expressions = [...expressions];
		}
	}

	Where(expression: string): DBQuery {
		return new DBQuery([...this._expressions, expression]);
	}

	Run(db: RePraxisDatabase, bindings?: Record<string, unknown>[] | Record<string, unknown>): QueryResult {
		// Convert input bindings to nodes
		let convertedBindings: Map<string, INode>[] = []

		if (bindings !== undefined) {
			if (Array.isArray(bindings)) {
				convertedBindings = bindings
					.map(binding => {
						const nodeBindings = new Map<string, INode>();

						for (const key of Object.keys(binding)) {
							nodeBindings.set(key, NodeFromAny(binding[key]));
						}

						return nodeBindings;
					});
			}
			else {
				const nodeBindings = new Map<string, INode>();

				for (const key of Object.keys(bindings)) {
					nodeBindings.set(key, NodeFromAny(bindings[key]));
				}

				convertedBindings.push(nodeBindings);
			}
		}


		let state = new QueryState(true, convertedBindings);

		for (const expressionStr of this._expressions) {
			// Step 1: Split the expression into parts using whitespace
			const expressionParts = expressionStr
				.split(" ").map(s => s.trim());

			// Step 2: Classify this expression string by the total number of parts
			//         and execute the expression

			// This is an assertion expression that may contain variables
			if (expressionParts.length == 1) {
				state = new AssertExpression(expressionParts[0]).Evaluate(db, state);
			}
			// This is probably a not expression
			else if (expressionParts.length == 2) {
				if (expressionParts[0] == "not") {
					// This is a "not x.y.z" expression
					state = new NotExpression(expressionParts[1]).Evaluate(db, state);
				}
				else {
					throw new Error(`Unrecognized query expression '${expressionStr}'.`);
				}
			}
			// This is probably a comparator/inequality statement
			else if (expressionParts.length == 3) {
				// Check to see what comparator is called
				const comparisonOp = expressionParts[0];

				switch (comparisonOp) {
					case "eq":
						state = new EqualsExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					case "neq":
						state = new NotEqualExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					case "lt":
						state = new LessThanExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					case "gt":
						state = new GreaterThanExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					case "lte":
						state = new LessThanEqualToExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					case "gte":
						state = new GreaterThanEqualToExpression(expressionParts[1], expressionParts[2])
							.Evaluate(db, state);
						break;
					default:
						throw new Error(
							`Unrecognized comparison operator in ${expressionStr}.`
						);
				}
			}
			// This expression is not recognized
			else {
				throw new Error(`Unrecognized query expression '${expressionStr}'.`);
			}

			// Step 3: Check if the query has failed and quit processing if true
			if (!state.success) break;
		}

		return state.ToResult();
	}
}
