"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBQuery = exports.NotExpression = exports.NotEqualExpression = exports.LessThanExpression = exports.LessThanEqualToExpression = exports.GreaterThanExpression = exports.GreaterThanEqualToExpression = exports.EqualsExpression = exports.AssertExpression = exports.UnifyAll = exports.Unify = exports.QueryBindingContext = exports.QueryResult = exports.QueryState = exports.RePraxisDatabase = exports.ParseSentence = exports.NodeFromAny = exports.NodeFromString = exports.BindSentence = exports.HasVariables = exports.VariableNode = exports.SymbolNode = exports.IntNode = exports.FloatNode = exports.Node = exports.NodeCardinalityError = exports.NodeTypeError = exports.NodeCardinality = exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType[NodeType["VARIABLE"] = 0] = "VARIABLE";
    NodeType[NodeType["SYMBOL"] = 1] = "SYMBOL";
    NodeType[NodeType["INT"] = 2] = "INT";
    NodeType[NodeType["FLOAT"] = 3] = "FLOAT";
    NodeType[NodeType["STRING"] = 4] = "STRING";
})(NodeType || (exports.NodeType = NodeType = {}));
var NodeCardinality;
(function (NodeCardinality) {
    NodeCardinality[NodeCardinality["NONE"] = 0] = "NONE";
    NodeCardinality[NodeCardinality["ONE"] = 1] = "ONE";
    NodeCardinality[NodeCardinality["MANY"] = 2] = "MANY";
})(NodeCardinality || (exports.NodeCardinality = NodeCardinality = {}));
class NodeTypeError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.NodeTypeError = NodeTypeError;
class NodeCardinalityError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.NodeCardinalityError = NodeCardinalityError;
class Node {
    constructor(symbol, value, cardinality) {
        this._parent = null;
        this._children = new Map();
        this._symbol = symbol;
        this._value = value;
        this._cardinality = cardinality;
    }
    GetSymbol() { return this._symbol; }
    GetCardinality() { return this._cardinality; }
    GetChildren() { return [...this._children.values()]; }
    GetParent() { return this._parent; }
    GetRawValue() { return this._value; }
    GetValue() { return this._value; }
    AddChild(node) {
        if (this._cardinality === NodeCardinality.NONE) {
            throw new Error("Cannot add child to node with cardinality NONE");
        }
        if (this._cardinality === NodeCardinality.ONE && this._children.size >= 1) {
            throw new Error("Cannot add additional child to node with cardinality ONE");
        }
        this._children.set(node.GetSymbol(), node);
        node.SetParent(this);
    }
    SetParent(node) {
        if (this._parent !== null && node !== null) {
            throw new Error("Node already has a parent.");
        }
        this._parent = node;
    }
    RemoveChild(symbol) {
        const child = this._children.get(symbol);
        if (child !== undefined) {
            child.SetParent(null);
            return this._children.delete(symbol);
        }
        return false;
    }
    GetChild(symbol) {
        const child = this._children.get(symbol);
        if (child !== undefined) {
            return child;
        }
        throw new Error(`No child node found with symbol: ${symbol}`);
    }
    HasChild(symbol) {
        return this._children.has(symbol);
    }
    ClearChildren() {
        for (const [, child] of this._children) {
            child.SetParent(null);
            child.ClearChildren();
        }
        this._children.clear();
    }
    GetPath() {
        if (this._parent === null || this._parent.GetSymbol() === "root") {
            return this._symbol;
        }
        else {
            const parentCardinalityOp = this._parent.GetCardinality() === NodeCardinality.ONE ? "!" : ".";
            return this._parent.GetPath() + parentCardinalityOp + Symbol;
        }
    }
    ToString() { return this._symbol; }
}
exports.Node = Node;
class FloatNode extends Node {
    constructor(value, cardinality) {
        super(value.toPrecision(3), value, cardinality);
    }
    GetNodeType() {
        return NodeType.FLOAT;
    }
    EqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return false;
        return this._value === other.GetValue();
    }
    NotEqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return true;
        return this._value != other.GetValue();
    }
    GreaterThanEqualTo(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value >= other.GetValue();
        }
        return this._value >= other.GetValue();
    }
    LessThanEqualTo(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value <= other.GetValue();
        }
        return this._value <= other.GetValue();
    }
    LessThan(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value < other.GetValue();
        }
        return this._value < other.GetValue();
    }
    GreaterThan(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value > other.GetValue();
        }
        return this._value > other.GetValue();
    }
    Copy() {
        return new FloatNode(this._value, this._cardinality);
    }
}
exports.FloatNode = FloatNode;
class IntNode extends Node {
    constructor(value, cardinality) {
        super(Math.trunc(value).toString(), Math.trunc(value), cardinality);
    }
    GetNodeType() {
        return NodeType.INT;
    }
    EqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return false;
        return this._value === other.GetValue();
    }
    NotEqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return true;
        return this._value != other.GetValue();
    }
    GreaterThanEqualTo(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value >= other.GetValue();
        }
        return this._value >= other.GetValue();
    }
    LessThanEqualTo(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value <= other.GetValue();
        }
        return this._value <= other.GetValue();
    }
    LessThan(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value < other.GetValue();
        }
        return this._value < other.GetValue();
    }
    GreaterThan(other) {
        if (other.GetNodeType() != NodeType.INT && other.GetNodeType() != NodeType.FLOAT) {
            throw new NodeTypeError(`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        if (other.GetNodeType() === NodeType.FLOAT) {
            return this._value > other.GetValue();
        }
        return this._value > other.GetValue();
    }
    Copy() {
        return new IntNode(this._value, this._cardinality);
    }
}
exports.IntNode = IntNode;
class SymbolNode extends Node {
    constructor(value, cardinality) {
        super(value, value, cardinality);
    }
    GetNodeType() {
        return NodeType.SYMBOL;
    }
    EqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return false;
        return this._value === other.GetValue();
    }
    NotEqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return true;
        return this._value != other.GetValue();
    }
    GreaterThanEqualTo(other) {
        if (other.GetNodeType() != this.GetNodeType()) {
            throw new NodeTypeError(`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        const result = this._value.localeCompare(other.GetValue());
        return result >= 0;
    }
    LessThanEqualTo(other) {
        if (other.GetNodeType() != this.GetNodeType()) {
            throw new NodeTypeError(`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        const result = this._value.localeCompare(other.GetValue());
        return result <= 0;
    }
    LessThan(other) {
        if (other.GetNodeType() != this.GetNodeType()) {
            throw new NodeTypeError(`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        const result = this._value.localeCompare(other.GetValue());
        return result < 0;
    }
    GreaterThan(other) {
        if (other.GetNodeType() != this.GetNodeType()) {
            throw new NodeTypeError(`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
        }
        const result = this._value.localeCompare(other.GetValue());
        return result > 0;
    }
    Copy() {
        return new SymbolNode(this._value, this._cardinality);
    }
}
exports.SymbolNode = SymbolNode;
class VariableNode extends Node {
    constructor(value, cardinality) {
        super(value, value, cardinality);
    }
    GetNodeType() {
        return NodeType.VARIABLE;
    }
    EqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return false;
        return this._value === other.GetValue();
    }
    NotEqualTo(other) {
        if (other.GetNodeType() !== this.GetNodeType())
            return true;
        return this._value != other.GetValue();
    }
    GreaterThanEqualTo(other) {
        throw new NodeTypeError(`gte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
    }
    LessThanEqualTo(other) {
        throw new NodeTypeError(`lte not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
    }
    LessThan(other) {
        throw new NodeTypeError(`lt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
    }
    GreaterThan(other) {
        throw new NodeTypeError(`gt not defined between nodes of type ${this.GetNodeType()} and ${other.GetNodeType()}`);
    }
    Copy() {
        return new VariableNode(this._value, this._cardinality);
    }
}
exports.VariableNode = VariableNode;
function HasVariables(sentence) {
    return ParseSentence(sentence)
        .filter(n => n.GetNodeType() === NodeType.VARIABLE)
        .length > 0;
}
exports.HasVariables = HasVariables;
function BindSentence(sentence, bindings) {
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
exports.BindSentence = BindSentence;
function NodeFromString(token, cardinality) {
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
exports.NodeFromString = NodeFromString;
function NodeFromAny(value) {
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
        return new SymbolNode(value, NodeCardinality.NONE);
    }
    throw new Error(`Cannot convert (${value}) of type ${typeof value} to node`);
}
exports.NodeFromAny = NodeFromAny;
function ParseSentence(sentence) {
    const nodes = [];
    let currentToken = "";
    let processingLiteral = false;
    for (const char of sentence) {
        if (char === "[") {
            processingLiteral = true;
        }
        else if (char === "]") {
            processingLiteral = false;
        }
        else if ((char === "!" || char === ".") && !processingLiteral) {
            const cardinality = (char === "!") ? NodeCardinality.ONE : NodeCardinality.MANY;
            nodes.push(NodeFromString(currentToken, cardinality));
            currentToken = "";
        }
        else {
            currentToken += char;
        }
    }
    if (processingLiteral) {
        throw new Error(`Could not find closing ']' for value in: '${sentence}'`);
    }
    nodes.push(NodeFromString(currentToken, NodeCardinality.MANY));
    return nodes;
}
exports.ParseSentence = ParseSentence;
class RePraxisDatabase {
    constructor() {
        this._root = new SymbolNode("root", NodeCardinality.MANY);
    }
    Insert(sentence) {
        const nodes = ParseSentence(sentence);
        let subtree = this._root;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i].Copy();
            if (node.GetNodeType() == NodeType.VARIABLE) {
                throw new Error(`Found variable ${node.GetSymbol()} in sentence '(${sentence})'. `
                    + "Sentence cannot contain variables when inserting a value.");
            }
            if (!subtree.HasChild(node.GetSymbol())) {
                if (subtree.GetCardinality() == NodeCardinality.ONE) {
                    subtree.ClearChildren();
                }
                subtree.AddChild(node);
                subtree = node;
            }
            else {
                const existingNode = subtree.GetChild(node.GetSymbol());
                if (existingNode.GetCardinality() != node.GetCardinality()) {
                    throw new NodeCardinalityError(`Cardinality mismatch on ${node.GetSymbol()} in sentence '${sentence}'.`);
                }
                subtree = existingNode;
            }
        }
    }
    Assert(sentence) {
        const nodes = ParseSentence(sentence);
        let currentNode = this._root;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.GetNodeType() == NodeType.VARIABLE) {
                throw new NodeTypeError(`Found variable ${node.GetSymbol()} in sentence.`
                    + "Sentence cannot contain variables when retrieving a value.");
            }
            if (!currentNode.HasChild(node.GetSymbol()))
                return false;
            if (i == nodes.length - 1)
                return true;
            currentNode = currentNode.GetChild(node.GetSymbol());
            if (currentNode.GetCardinality() != node.GetCardinality())
                return false;
        }
        return true;
    }
    Delete(sentence) {
        const nodes = ParseSentence(sentence);
        let currentNode = this._root;
        for (let i = 0; i < nodes.length - 1; i++) {
            const node = nodes[i];
            currentNode = currentNode.GetChild(node.GetSymbol());
        }
        const lastToken = nodes[nodes.length - 1];
        return currentNode.RemoveChild(lastToken.GetSymbol());
    }
    Clear() {
        this._root.ClearChildren();
    }
    GetRoot() { return this._root; }
}
exports.RePraxisDatabase = RePraxisDatabase;
class QueryState {
    constructor(success, bindings) {
        this.success = success;
        this.bindings = bindings.map(b => new Map(b));
    }
    ToResult() {
        if (!this.success)
            return new QueryResult(false, []);
        const results = this.bindings
            .map((bindingMap) => {
            return new Map([...bindingMap.entries()].map(([key, value]) => {
                return [key, value.GetRawValue()];
            }));
        });
        return new QueryResult(true, results);
    }
}
exports.QueryState = QueryState;
class QueryResult {
    constructor(success, results) {
        this._success = success;
        this._bindings = results.map(entry => new Map(entry));
    }
    get Success() { return this._success; }
    get Bindings() { return this._bindings; }
    LimitToVars(variables) {
        if (!this._success) {
            return new QueryResult(false, []);
        }
        if (variables.length == 0) {
            return new QueryResult(true, []);
        }
        const filteredResults = this._bindings
            .map(bindingMap => {
            return new Map([...bindingMap.entries()]
                .filter(([key,]) => {
                return variables.includes(key);
            }));
        });
        return new QueryResult(true, filteredResults);
    }
}
exports.QueryResult = QueryResult;
class QueryBindingContext {
    constructor(bindings, subtree) {
        this._bindings = bindings;
        this._subtree = subtree;
    }
    get Bindings() {
        return this._bindings;
    }
    get SubTree() {
        return this._subtree;
    }
}
exports.QueryBindingContext = QueryBindingContext;
function Unify(database, sentence) {
    let unified = [
        new QueryBindingContext(new Map(), database.GetRoot())
    ];
    const tokens = ParseSentence(sentence);
    for (const token of tokens) {
        const nextUnified = [];
        for (const entry of unified) {
            for (const child of entry.SubTree.GetChildren()) {
                if (token.GetNodeType() == NodeType.VARIABLE) {
                    const unification = new QueryBindingContext(new Map(entry.Bindings), child);
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
        .filter(binding => binding.size > 0);
}
exports.Unify = Unify;
function UnifyAll(database, state, sentences) {
    let possibleBindings = [...state.bindings];
    for (const sentence of sentences) {
        const iterativeBindings = [];
        const newBindings = Unify(database, sentence);
        if (possibleBindings.length === 0) {
            for (const binding of newBindings) {
                iterativeBindings.push(new Map(binding));
            }
        }
        else {
            for (const oldBinding of possibleBindings) {
                for (const binding of newBindings) {
                    const newKeys = [...binding.keys()].filter(k => !oldBinding.has(k));
                    const oldKeys = [...binding.keys()].filter(k => oldBinding.has(k));
                    const existsIncompatibleKey = oldKeys.some(k => {
                        const oldVal = oldBinding.get(k);
                        const newVal = binding.get(k);
                        if (oldVal !== undefined && newVal !== undefined) {
                            return !oldVal.EqualTo(newVal);
                        }
                        throw new Error("Missing value in binding map.");
                    });
                    if (existsIncompatibleKey) {
                        continue;
                    }
                    else {
                        const nextUnification = new Map(oldBinding);
                        for (const k of newKeys) {
                            const node = binding.get(k);
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
exports.UnifyAll = UnifyAll;
class AssertExpression {
    constructor(statement) {
        this._statement = statement;
    }
    Evaluate(database, state) {
        if (HasVariables(this._statement)) {
            const bindings = UnifyAll(database, state, [this._statement]);
            if (bindings.length == 0)
                return new QueryState(false, []);
            const validBindings = bindings
                .filter((binding) => {
                return database.Assert(BindSentence(this._statement, binding));
            });
            if (validBindings.length == 0)
                return new QueryState(false, []);
            return new QueryState(true, validBindings);
        }
        if (!database.Assert(this._statement))
            return new QueryState(false, []);
        return state;
    }
}
exports.AssertExpression = AssertExpression;
class EqualsExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.EqualTo(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.EqualsExpression = EqualsExpression;
class GreaterThanEqualToExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.GreaterThanEqualTo(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.GreaterThanEqualToExpression = GreaterThanEqualToExpression;
class GreaterThanExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.GreaterThan(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.GreaterThanExpression = GreaterThanExpression;
class LessThanEqualToExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.LessThanEqualTo(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.LessThanEqualToExpression = LessThanEqualToExpression;
class LessThanExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.LessThan(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.LessThanExpression = LessThanExpression;
class NotEqualExpression {
    constructor(lhValue, rhValue) {
        this._lhValue = lhValue;
        this._rhValue = rhValue;
    }
    Evaluate(database, state) {
        const lhNodes = ParseSentence(this._lhValue);
        const rhNodes = ParseSentence(this._rhValue);
        if (lhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._lhValue} has too many parts.`);
        }
        if (rhNodes.length > 1) {
            throw new Error("Comparator expression may only be single variables, symbols, or constants. "
                + `${this._rhValue} has too many parts.`);
        }
        if (state.bindings.length == 0
            && (HasVariables(this._lhValue) || HasVariables(this._rhValue))) {
            return new QueryState(false, []);
        }
        const validBindings = state.bindings
            .filter((binding) => {
            const leftNode = ParseSentence(BindSentence(this._lhValue, binding))[0];
            const rightNode = ParseSentence(BindSentence(this._rhValue, binding))[0];
            return leftNode.NotEqualTo(rightNode);
        });
        if (validBindings.length == 0) {
            return new QueryState(false, []);
        }
        return new QueryState(true, validBindings);
    }
}
exports.NotEqualExpression = NotEqualExpression;
class NotExpression {
    constructor(statement) {
        this._statement = statement;
    }
    Evaluate(database, state) {
        if (HasVariables(this._statement)) {
            if (state.bindings.length == 0) {
                const bindings = UnifyAll(database, state, [this._statement]);
                if (bindings.length > 0)
                    return new QueryState(false, []);
                return state;
            }
            const validBindings = state.bindings
                .filter((binding) => {
                const sentence = BindSentence(this._statement, binding);
                if (HasVariables(sentence)) {
                    const scopedBindings = UnifyAll(database, new QueryState(true, []), [sentence]);
                    if (scopedBindings.length > 0)
                        return false;
                    return true;
                }
                return !database.Assert(sentence);
            });
            if (validBindings.length == 0)
                return new QueryState(false, []);
            return new QueryState(true, validBindings);
        }
        if (database.Assert(this._statement))
            return new QueryState(false, []);
        return state;
    }
}
exports.NotExpression = NotExpression;
class DBQuery {
    constructor(expressions) {
        this._expressions = [];
        if (expressions !== undefined) {
            this._expressions = [...expressions];
        }
    }
    Where(expression) {
        return new DBQuery([...this._expressions, expression]);
    }
    Run(db, bindings) {
        let convertedBindings = [];
        if (bindings !== undefined) {
            if (Array.isArray(bindings)) {
                convertedBindings = bindings
                    .map(binding => {
                    const nodeBindings = new Map();
                    for (const key of Object.keys(binding)) {
                        nodeBindings.set(key, NodeFromAny(binding[key]));
                    }
                    return nodeBindings;
                });
            }
            else {
                const nodeBindings = new Map();
                for (const key of Object.keys(bindings)) {
                    nodeBindings.set(key, NodeFromAny(bindings[key]));
                }
                convertedBindings.push(nodeBindings);
            }
        }
        let state = new QueryState(true, convertedBindings);
        for (const expressionStr of this._expressions) {
            const expressionParts = expressionStr
                .split(" ").map(s => s.trim());
            if (expressionParts.length == 1) {
                state = new AssertExpression(expressionParts[0]).Evaluate(db, state);
            }
            else if (expressionParts.length == 2) {
                if (expressionParts[0] == "not") {
                    state = new NotExpression(expressionParts[1]).Evaluate(db, state);
                }
                else {
                    throw new Error(`Unrecognized query expression '${expressionStr}'.`);
                }
            }
            else if (expressionParts.length == 3) {
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
                        throw new Error(`Unrecognized comparison operator in ${expressionStr}.`);
                }
            }
            else {
                throw new Error(`Unrecognized query expression '${expressionStr}'.`);
            }
            if (!state.success)
                break;
        }
        return state.ToResult();
    }
}
exports.DBQuery = DBQuery;
//# sourceMappingURL=index.js.map