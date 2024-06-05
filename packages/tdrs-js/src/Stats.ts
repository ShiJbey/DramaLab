import { Observable, Subject } from "rxjs";
import { IModifier } from "./Modifiers";
import { SocialEntity } from "./ISocialEntity";

export class StatInitializer {
	public readonly stat: string;
	public readonly baseValue: number;

	constructor(stat: string, baseValue: number) {
		this.stat = stat;
		this.baseValue = baseValue
	}
}

export enum StatModifierType {
	FLAT = 100,
	PERCENT_ADD = 200,
	PERCENT_MULTIPLY = 300,
}

export class StatSchema {

	public readonly stat: string;
	public readonly baseValue: number;
	public readonly minValue: number;
	public readonly maxValue: number;
	public readonly isDiscrete: boolean;

	constructor(
		stat: string,
		baseValue: number,
		minValue: number,
		maxValue: number,
		isDiscrete: boolean,
	) {
		this.stat = stat;
		this.baseValue = baseValue;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.isDiscrete = isDiscrete;
	}
}

export class StatModifierData {
	public readonly stat: string;
	public readonly value: number;
	public readonly modifierType: StatModifierType;

	constructor(stat: string, value: number, modifierType: StatModifierType) {
		this.stat = stat;
		this.value = value;
		this.modifierType = modifierType;
	}
}

export class StatModifier implements IModifier {
	public readonly stat: string;
	public readonly value: number;
	public readonly modifierType: StatModifierType;
	public readonly order: number;
	public readonly source: object | null;
	public readonly hasDuration: boolean;
	private _duration: number;

	constructor(
		stat: string,
		value: number,
		modifierType: StatModifierType,
		duration = -1,
		source: object | null = null,
		order = -1,
	) {
		this.stat = stat;
		this.value = value;
		this.modifierType = modifierType;
		this.order = (order < 0) ? modifierType : order;
		this.source = source;
		this.hasDuration = duration > 0;
		this._duration = duration;
	}

	hasExpired(entity: SocialEntity): boolean {
		return this.hasDuration && this._duration <= 0;
	}

	apply(entity: SocialEntity): void {
		entity.stats.getStat(this.stat).addModifier(this)
	}

	remove(entity: SocialEntity): void {
		entity.stats.getStat(this.stat).removeModifier(this);
	}

	update(entity: SocialEntity): void {
		if (this.hasDuration) {
			this._duration -= 1;
		}
	}

	get description(): string {
		if (this.modifierType == StatModifierType.FLAT) {
			return `Add ${this.value} to ${this.stat}`
		}
		else if (this.modifierType == StatModifierType.PERCENT_ADD) {
			return `Add ${this.value * 100}% to ${this.stat}`
		}
		else {
			return `Scales ${this.stat} to ${this.value * 100}%`
		}
	}
}

export const STAT_ROUND_PRECISION = 3;

export type StatValueChangedArgs = {
	value: number;
};

export class Stat {

	private _baseValue: number;
	private _value: number;
	private _normalizedValue: number;
	private _modifiers: StatModifier[];
	private _minValue: number;
	private _maxValue: number;
	private _isDiscrete: boolean;
	private _isDirty: boolean;

	private readonly _onValueChanged: Subject<StatValueChangedArgs>;

	constructor(
		baseValue: number,
		minValue = -999999,
		maxValue = 999999,
		isDiscrete = false,
	) {
		this._baseValue = baseValue;
		this._value = baseValue;
		this._modifiers = [];
		this._isDirty = true;
		this._isDiscrete = isDiscrete;
		this._minValue = minValue;
		this._maxValue = maxValue;
		this._normalizedValue = 0;
		this._onValueChanged = new Subject();
	}

	get onValueChanged(): Observable<StatValueChangedArgs> {
		return this._onValueChanged.asObservable();
	}
	get baseValue(): number { return this._baseValue; }
	set baseValue(value: number) {
		this._baseValue = value;
		this._isDirty = true;
		this._onValueChanged.next({ value: this.value });
	}

	get value(): number {
		if (this._isDirty) {
			this.recalculateValue();
		}
		return this._value;
	}
	get minValue(): number { return this._minValue; }
	get maxValue(): number { return this._maxValue; }
	get isDiscrete(): boolean { return this._isDiscrete; }
	get normalized(): number {
		if (this._isDirty) {
			this.recalculateValue();
		}
		return this._normalizedValue;
	}
	get modifiers(): StatModifier[] { return this._modifiers; }


	addModifier(modifier: StatModifier): void {
		this._modifiers.push(modifier);
		this._modifiers.sort((a, b) => {
			if (a.order < b.order) return -1;
			if (a.order === b.order) return 0;
			return 1;
		});
		this._isDirty = true;
		this._onValueChanged.next({ value: this.value });
	}

	removeModifier(modifier: StatModifier): boolean {
		// Removes item at given index and success if there was at least
		// one item removed.
		const success = this._modifiers.splice(this._modifiers.indexOf(modifier), 1).length > 0;

		if (success) {
			this._isDirty = true;
			this._onValueChanged.next({ value: this.value });
		}

		return success;
	}

	removeModifiersFromSource(source: object): boolean {
		let removedAnyModifier = false;

		for (let i = this._modifiers.length - 1; i >= 0; i--) {
			const modifier = this._modifiers[i];
			if (modifier.source === source) {
				this._modifiers.splice(i, 1);
				removedAnyModifier = true;
				this._isDirty = true;
			}
		}

		if (removedAnyModifier) {
			this._onValueChanged.next({ value: this.value });
		}

		return removedAnyModifier;
	}


	recalculateValue(): void {
		let finalValue = this._baseValue;
		let percentAddSum = 0;

		for (let i = 0; i < this._modifiers.length; i++) {
			const modifier = this._modifiers[i];

			if (modifier.modifierType === StatModifierType.FLAT) {
				finalValue += modifier.value;
			}

			if (modifier.modifierType === StatModifierType.PERCENT_ADD) {
				percentAddSum += modifier.value;

				if (
					(i + 1) >= this._modifiers.length
					|| this._modifiers[i + 1].modifierType != StatModifierType.PERCENT_ADD
				) {
					finalValue = finalValue * (1 + percentAddSum);
					percentAddSum = 0;
				}
			}

			if (modifier.modifierType === StatModifierType.PERCENT_MULTIPLY) {
				finalValue = finalValue * (1 + modifier.value);
			}
		}

		finalValue = Math.max(this._minValue, Math.min(this._maxValue, finalValue));

		if (this._isDiscrete) {
			finalValue = Math.floor(finalValue);
		}

		finalValue = parseFloat(finalValue.toPrecision(STAT_ROUND_PRECISION));

		this._normalizedValue = parseFloat(
			((finalValue - this._minValue) / (this._maxValue - this._minValue)).toPrecision(
				STAT_ROUND_PRECISION
			));

		this._value = finalValue;
		this._isDirty = false;
	}
}

export class StatManager {

	private readonly _stats: Map<string, Stat>;

	constructor() {
		this._stats = new Map();
	}

	addStat(statName: string, stat: Stat): void {
		this._stats.set(statName, stat);
	}

	getStat(statName: string): Stat {
		const stat = this._stats.get(statName);

		if (stat === undefined) throw new Error(`Could not find stat for ${statName}`);

		return stat;
	}

	hasStat(statName: string): boolean {
		return this._stats.has(statName);
	}
}
