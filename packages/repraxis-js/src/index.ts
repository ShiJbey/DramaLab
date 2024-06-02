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
	getNodeType(): NodeType;
	getSymbol(): string;
	getCardinality(): NodeCardinality;
	getChildren(): INode[];
	getParent(): INode | null;
	getRawValue(): unknown;

	equalTo(other: INode): boolean;
	notEqualTo(other: INode): boolean;
	greaterThanEqualTo(other: INode): boolean;
	greaterThan(other: INode): boolean;
	lessThan(other: INode): boolean;
	lessThanEqualTo(other: INode): boolean;

	addChild(node: INode): void;
	setParent(node: INode | null): void;
	removeChild(symbol: string): boolean;
	getChild(symbol: string): INode;
	hasChild(symbol: string): boolean;
	clearChildren(): void;

	getPath(): string;
	copy(): INode;
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

	abstract getNodeType(): NodeType;
	getSymbol(): string { return this._symbol; }
	getCardinality(): NodeCardinality { return this._cardinality; }
	getChildren(): INode[] { return [...this._children.values()]; }
	getParent(): INode | null { return this._parent; }
	getRawValue(): unknown { return this._value; }
	GetValue(): T { return this._value; }

	abstract equalTo(other: INode): boolean;
	abstract notEqualTo(other: INode): boolean;
	abstract greaterThanEqualTo(other: INode): boolean;
	abstract greaterThan(other: INode): boolean;
	abstract lessThan(other: INode): boolean;
	abstract lessThanEqualTo(other: INode): boolean;

	addChild(node: INode): void {
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

		this._children.set(node.getSymbol(), node);
		node.setParent(this);
	}

	setParent(node: INode | null): void {
		if (this._parent !== null && node !== null) {
			throw new Error("Node already has a parent.");
		}

		this._parent = node;
	}

	removeChild(symbol: string): boolean {

		const child = this._children.get(symbol);

		if (child !== undefined) {

			child.setParent(null);

			return this._children.delete(symbol);
		}

		return false;
	}

	getChild(symbol: string): INode {
		const child = this._children.get(symbol);

		if (child !== undefined) {
			return child;
		}

		throw new Error(`No child node found with symbol: ${symbol}`);
	}

	hasChild(symbol: string): boolean {
		return this._children.has(symbol);
	}

	clearChildren(): void {
		for (const [, child] of this._children) {
			child.setParent(null);
			child.clearChildren();
		}

		this._children.clear();
	}


	getPath(): string {
		if (this._parent === null || this._parent.getSymbol() === "root") {
			return this._symbol;
		}
		else {
			const parentCardinalityOp = this._parent.getCardinality() === NodeCardinality.ONE ? "!" : ".";
			return this._parent.getPath() + parentCardinalityOp + Symbol;
		}
	}

	abstract copy(): INode;

	toString(): string { return this._symbol; }
}

export class FloatNode extends Node<number> {

	constructor(value: number, cardinality: NodeCardinality) {
		super(value.toPrecision(3), value, cardinality);
	}

	getNodeType(): NodeType {
		return NodeType.FLOAT;
	}



	equalTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return false;

		return this._value === (other as FloatNode).GetValue();
	}

	notEqualTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return true;

		return this._value != (other as FloatNode).GetValue();
	}

	greaterThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value >= (other as FloatNode).GetValue();
		}

		return this._value >= (other as IntNode).GetValue();
	}

	lessThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value <= (other as FloatNode).GetValue();
		}

		return this._value <= (other as IntNode).GetValue();
	}

	lessThan(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value < (other as FloatNode).GetValue();
		}

		return this._value < (other as IntNode).GetValue();
	}

	greaterThan(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value > (other as FloatNode).GetValue();
		}

		return this._value > (other as IntNode).GetValue();
	}

	copy(): INode {
		return new FloatNode(this._value, this._cardinality);
	}
}

export class IntNode extends Node<number> {

	constructor(value: number, cardinality: NodeCardinality) {
		super(Math.trunc(value).toString(), Math.trunc(value), cardinality);
	}

	getNodeType(): NodeType {
		return NodeType.INT;
	}

	equalTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return false;

		return this._value === (other as IntNode).GetValue();
	}

	notEqualTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return true;

		return this._value != (other as IntNode).GetValue();
	}

	greaterThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value >= (other as FloatNode).GetValue();
		}

		return this._value >= (other as IntNode).GetValue();
	}

	lessThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value <= (other as FloatNode).GetValue();
		}

		return this._value <= (other as IntNode).GetValue();
	}

	lessThan(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value < (other as FloatNode).GetValue();
		}

		return this._value < (other as IntNode).GetValue();
	}

	greaterThan(other: INode): boolean {
		if (other.getNodeType() != NodeType.INT && other.getNodeType() != NodeType.FLOAT) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		if (other.getNodeType() === NodeType.FLOAT) {
			return this._value > (other as FloatNode).GetValue();
		}

		return this._value > (other as IntNode).GetValue();
	}

	copy(): INode {
		return new IntNode(this._value, this._cardinality);
	}
}

export class SymbolNode extends Node<string> {

	constructor(value: string, cardinality: NodeCardinality) {
		super(value, value, cardinality);
	}

	getNodeType(): NodeType {
		return NodeType.SYMBOL;
	}

	equalTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return false;

		return this._value === (other as SymbolNode).GetValue();
	}

	notEqualTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return true;

		return this._value != (other as SymbolNode).GetValue();
	}

	greaterThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != this.getNodeType()) {
			throw new NodeTypeError(
				`gte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result >= 0;
	}

	lessThanEqualTo(other: INode): boolean {
		if (other.getNodeType() != this.getNodeType()) {
			throw new NodeTypeError(
				`lte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result <= 0;
	}

	lessThan(other: INode): boolean {
		if (other.getNodeType() != this.getNodeType()) {
			throw new NodeTypeError(
				`lt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result < 0;
	}

	greaterThan(other: INode): boolean {
		if (other.getNodeType() != this.getNodeType()) {
			throw new NodeTypeError(
				`gt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
			);
		}

		const result = this._value.localeCompare((other as SymbolNode).GetValue());

		return result > 0;
	}

	copy(): INode {
		return new SymbolNode(this._value, this._cardinality);
	}
}

export class VariableNode extends Node<string> {

	constructor(value: string, cardinality: NodeCardinality) {
		super(value, value, cardinality);
	}

	getNodeType(): NodeType {
		return NodeType.VARIABLE;
	}

	equalTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return false;

		return this._value === (other as VariableNode).GetValue();
	}

	notEqualTo(other: INode): boolean {
		if (other.getNodeType() !== this.getNodeType()) return true;

		return this._value != (other as VariableNode).GetValue();
	}

	greaterThanEqualTo(other: INode): boolean {
		throw new NodeTypeError(
			`gte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
		);
	}

	lessThanEqualTo(other: INode): boolean {
		throw new NodeTypeError(
			`lte not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
		);
	}

	lessThan(other: INode): boolean {
		throw new NodeTypeError(
			`lt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
		);
	}

	greaterThan(other: INode): boolean {
		throw new NodeTypeError(
			`gt not defined between nodes of type ${this.getNodeType()} and ${other.getNodeType()}`
		);
	}

	copy(): INode {
		return new VariableNode(this._value, this._cardinality);
	}
}

export function hasVariables(sentence: string): boolean {
	return parseSentence(sentence)
		.filter(n => n.getNodeType() === NodeType.VARIABLE)
		.length > 0;
}

export function bindSentence(sentence: string, bindings: Map<string, INode>): string {
	const nodes = parseSentence(sentence);

	let finalSentence = "";

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];

		if (node.getNodeType() === NodeType.VARIABLE) {
			const boundNode = bindings.get(node.getSymbol());
			if (boundNode !== undefined) {
				finalSentence += boundNode.getSymbol();
			}
			else {
				finalSentence += node.getSymbol();
			}
		}
		else {
			finalSentence += node.getSymbol();
		}

		if (i < nodes.length - 1) {
			finalSentence += node.getCardinality() == NodeCardinality.ONE ? "!" : ".";
		}
	}

	return finalSentence;
}

export function nodeFromString(token: string, cardinality: NodeCardinality): INode {
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

export function nodeFromAny(value: unknown): INode {
	const numericValue = Number(value);

	if (!isNaN(numericValue)) {
		if (Number.isInteger(numericValue)) {
			return new IntNode(value as number, NodeCardinality.NONE);
		}
		else {
			return new FloatNode(value as number, NodeCardinality.NONE);
		}
	}

	else if (typeof value === "string") {
		return new SymbolNode(value as string, NodeCardinality.NONE);
	}

	else if (value instanceof String) {
		return new SymbolNode(value.toString(), NodeCardinality.NONE);
	}

	throw new Error(`Cannot convert (${value}) of type ${typeof value} to node`);
}

export function parseSentence(sentence: string): INode[] {
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

			nodes.push(nodeFromString(currentToken, cardinality))

			currentToken = ""
		}
		else {
			currentToken += char
		}
	}

	if (processingLiteral) {
		throw new Error(`Could not find closing ']' for value in: '${sentence}'`)
	}

	nodes.push(nodeFromString(currentToken, NodeCardinality.MANY))

	return nodes
}

export class RePraxisDatabase {
	private _root: INode;

	constructor() {
		this._root = new SymbolNode("root", NodeCardinality.MANY);
	}

	insert(sentence: string): void {
		const nodes = parseSentence(sentence);

		let subtree = this._root;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i].copy();

			if (node.getNodeType() == NodeType.VARIABLE) {
				throw new Error(
					`Found variable ${node.getSymbol()} in sentence '(${sentence})'. `
					+ "Sentence cannot contain variables when inserting a value."
				);
			}

			if (!subtree.hasChild(node.getSymbol())) {
				if (subtree.getCardinality() == NodeCardinality.ONE) {
					// Replace the existing child
					subtree.clearChildren();
				}

				subtree.addChild(node);
				subtree = node;
			}
			else {
				// We need to get the existing node, check cardinalities, and establish new
				// nodes
				const existingNode = subtree.getChild(node.getSymbol());

				if (existingNode.getCardinality() != node.getCardinality()) {
					throw new NodeCardinalityError(
						`Cardinality mismatch on ${node.getSymbol()} in sentence '${sentence}'.`
					);
				}

				subtree = existingNode;
			}
		}
	}

	assert(sentence: string): boolean {
		const nodes = parseSentence(sentence);

		let currentNode = this._root;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];

			if (node.getNodeType() == NodeType.VARIABLE) {
				throw new NodeTypeError(
					`Found variable ${node.getSymbol()} in sentence.`
					+ "Sentence cannot contain variables when retrieving a value."
				);
			}

			// Return early if there is not a corresponding node in the database
			if (!currentNode.hasChild(node.getSymbol())) return false;

			// We can stop iterating since we don't care about the cardinality of the last node
			if (i == nodes.length - 1) return true;

			// Update the current node for a cardinality check
			currentNode = currentNode.getChild(node.getSymbol());

			// The cardinalities of all intermediate nodes need to match
			if (currentNode.getCardinality() != node.getCardinality()) return false;
		}

		return true;
	}

	delete(sentence: string): boolean {
		const nodes = parseSentence(sentence);

		let currentNode = this._root;

		// Loop until we get to the second to last node
		for (let i = 0; i < nodes.length - 1; i++) {
			const node = nodes[i];
			currentNode = currentNode.getChild(node.getSymbol());
		}

		// Get a reference to the final node in the sentence
		const lastToken = nodes[nodes.length - 1];

		// Remove the child
		return currentNode.removeChild(lastToken.getSymbol());
	}

	clear(): void {
		this._root.clearChildren();
	}

	getRoot(): INode { return this._root; }
}

export class QueryState {
	public readonly success: boolean;
	public readonly bindings: Map<string, INode>[];

	constructor(success: boolean, bindings: Map<string, INode>[]) {
		this.success = success;
		this.bindings = bindings.map(b => new Map(b));
	}

	toResult(): QueryResult {
		if (!this.success) return new QueryResult(false, []);

		const results: Map<string, unknown>[] = this.bindings
			.map((bindingMap) => {
				return new Map(
					[...bindingMap.entries()].map(([key, value]) => {
						return [key, value.getRawValue()]
					})
				);
			});

		return new QueryResult(true, results);
	}
}

export class QueryResult {
	public readonly success: boolean;
	public readonly bindings: Map<string, unknown>[];

	constructor(success: boolean, results: Map<string, unknown>[]) {
		this.success = success;
		this.bindings = results.map(entry => new Map(entry));
	}

	limitToVars(variables: string[]): QueryResult {
		if (!this.success) {
			return new QueryResult(false, []);
		}

		if (variables.length == 0) {
			return new QueryResult(true, []);
		}

		const filteredResults: Map<string, unknown>[] = this.bindings
			.map(bindingMap => {
				return new Map(
					[...bindingMap.entries()]
						.filter(([key,]) => {
							return variables.includes(key)
						})
				);
			});

		return new QueryResult(true, filteredResults);
	}
}

export class QueryBindingContext {
	public readonly bindings: Map<string, INode>;
	public readonly subTree: INode;

	constructor(bindings: Map<string, INode>, subtree: INode) {
		this.bindings = bindings;
		this.subTree = subtree;
	}
}

export function unify(database: RePraxisDatabase, sentence: string): Map<string, INode>[] {
	let unified: QueryBindingContext[] = [
		new QueryBindingContext(new Map(), database.getRoot())
	];

	const tokens = parseSentence(sentence);

	for (const token of tokens) {
		const nextUnified: QueryBindingContext[] = [];

		for (const entry of unified) {
			for (const child of entry.subTree.getChildren()) {
				if (token.getNodeType() == NodeType.VARIABLE) {
					const unification = new QueryBindingContext(
						new Map(entry.bindings), child
					);

					unification.bindings.set(token.getSymbol(), child);

					nextUnified.push(unification);
				}
				else {
					if (token.getSymbol() == child.getSymbol()) {
						nextUnified.push(new QueryBindingContext(entry.bindings, child));
					}
				}
			}
		}

		unified = nextUnified;
	}

	return unified
		.map(entry => entry.bindings)
		.filter(binding => binding.size > 0)
}

export function unifyAll(database: RePraxisDatabase, state: QueryState, sentences: string[]): Map<string, INode>[] {
	let possibleBindings = [...state.bindings];


	for (const sentence of sentences) {
		const iterativeBindings: Map<string, INode>[] = [];
		const newBindings: Map<string, INode>[] = unify(database, sentence);

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
							return !oldVal.equalTo(newVal)
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
	evaluate(database: RePraxisDatabase, state: QueryState): QueryState;
}

export class AssertExpression implements IQueryExpression {

	private _statement: string;

	constructor(statement: string) {
		this._statement = statement;
	}

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		if (hasVariables(this._statement)) {
			const bindings = unifyAll(database, state, [this._statement]);

			if (bindings.length == 0) return new QueryState(false, []);

			const validBindings = bindings
				.filter(
					(binding) => {
						return database.assert(
							bindSentence(this._statement, binding)
						);
					}
				);

			if (validBindings.length == 0) return new QueryState(false, []);

			return new QueryState(true, validBindings);
		}

		if (!database.assert(this._statement)) return new QueryState(false, []);

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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.equalTo(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.greaterThanEqualTo(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.greaterThan(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.lessThanEqualTo(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.lessThan(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		const lhNodes = parseSentence(this._lhValue);
		const rhNodes = parseSentence(this._rhValue);

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
			&& (hasVariables(this._lhValue) || hasVariables(this._rhValue))
		) {
			return new QueryState(false, []);
		}

		// Loop through through the bindings and find those where the bound values
		// are equivalent.
		const validBindings: NodeBindingsList = state.bindings
			.filter((binding) => {
				const leftNode = parseSentence(
					bindSentence(this._lhValue, binding)
				)[0];

				const rightNode = parseSentence(
					bindSentence(this._rhValue, binding)
				)[0];

				return leftNode.notEqualTo(rightNode);
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

	evaluate(database: RePraxisDatabase, state: QueryState): QueryState {
		if (hasVariables(this._statement)) {
			// If there are no existing bindings, then this is the first statement in the query
			// or no previous statements contained variables.
			if (state.bindings.length == 0) {
				// We need to find bindings for all of the variables in this expression
				const bindings = unifyAll(database, state, [this._statement]);

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
						const sentence = bindSentence(this._statement, binding);

						if (hasVariables(sentence)) {
							// Treat the new sentence like its first in the query
							// and do a sub-unification, swapping out the state for an empty
							// one without existing bindings
							const scopedBindings = unifyAll(
								database,
								new QueryState(true, []),
								[sentence]
							);

							// If any of the remaining variables are bound in the scoped
							// bindings, then the entire binding fails
							if (scopedBindings.length > 0) return false;

							return true;
						}

						return !database.assert(sentence);
					}
				);

			if (validBindings.length == 0) return new QueryState(false, []);

			return new QueryState(true, validBindings);
		}

		if (database.assert(this._statement)) return new QueryState(false, []);

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

	where(expression: string): DBQuery {
		return new DBQuery([...this._expressions, expression]);
	}

	run(db: RePraxisDatabase, bindings?: Record<string, unknown>[] | Record<string, unknown>): QueryResult {
		// Convert input bindings to nodes
		let convertedBindings: Map<string, INode>[] = []

		if (bindings !== undefined) {
			if (Array.isArray(bindings)) {
				convertedBindings = bindings
					.map(binding => {
						const nodeBindings = new Map<string, INode>();

						for (const key of Object.keys(binding)) {
							nodeBindings.set(key, nodeFromAny(binding[key]));
						}

						return nodeBindings;
					});
			}
			else {
				const nodeBindings = new Map<string, INode>();

				for (const key of Object.keys(bindings)) {
					nodeBindings.set(key, nodeFromAny(bindings[key]));
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
				state = new AssertExpression(expressionParts[0]).evaluate(db, state);
			}
			// This is probably a not expression
			else if (expressionParts.length == 2) {
				if (expressionParts[0] == "not") {
					// This is a "not x.y.z" expression
					state = new NotExpression(expressionParts[1]).evaluate(db, state);
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
							.evaluate(db, state);
						break;
					case "neq":
						state = new NotEqualExpression(expressionParts[1], expressionParts[2])
							.evaluate(db, state);
						break;
					case "lt":
						state = new LessThanExpression(expressionParts[1], expressionParts[2])
							.evaluate(db, state);
						break;
					case "gt":
						state = new GreaterThanExpression(expressionParts[1], expressionParts[2])
							.evaluate(db, state);
						break;
					case "lte":
						state = new LessThanEqualToExpression(expressionParts[1], expressionParts[2])
							.evaluate(db, state);
						break;
					case "gte":
						state = new GreaterThanEqualToExpression(expressionParts[1], expressionParts[2])
							.evaluate(db, state);
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

		return state.toResult();
	}
}
