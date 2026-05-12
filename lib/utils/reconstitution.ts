import type { DoseUnit, MeasuredDoseUnit, SyringeType } from '@/types/tracker';

export interface ReconstitutionInput {
  vialAmount: number;
  vialUnit: MeasuredDoseUnit;
  bacWaterMl: number;
  targetDose: number;
  targetDoseUnit: MeasuredDoseUnit;
  syringeType?: SyringeType;
}

export interface ReconstitutionResult {
  outputMl: number;
  outputUnits: number;
  concentrationPerMl: number;
}

function toBaseAmount(amount: number, unit: MeasuredDoseUnit): number {
  if (unit === 'mg') {
    return amount * 1000;
  }

  return amount;
}

export function calculateReconstitution(input: ReconstitutionInput): ReconstitutionResult | null {
  const { bacWaterMl, targetDose, targetDoseUnit, vialAmount, vialUnit } = input;

  if (!vialAmount || !bacWaterMl || !targetDose || vialAmount <= 0 || bacWaterMl <= 0 || targetDose <= 0) {
    return null;
  }

  const hasIu = vialUnit === 'iu' || targetDoseUnit === 'iu';
  if (hasIu && vialUnit !== targetDoseUnit) {
    return null;
  }

  const vialBaseAmount = toBaseAmount(vialAmount, vialUnit);
  const targetBaseAmount = toBaseAmount(targetDose, targetDoseUnit);
  const concentrationPerMl = vialBaseAmount / bacWaterMl;
  const outputMl = targetBaseAmount / concentrationPerMl;

  return {
    concentrationPerMl,
    outputMl,
    outputUnits: outputMl * 100,
  };
}

const UNIT_LABELS: Record<DoseUnit, string> = {
  application: 'application',
  capsule: 'capsule',
  drop: 'drop',
  iu: 'IU',
  mcg: 'mcg',
  mg: 'mg',
  pump: 'pump',
  spray: 'spray',
};

const PLURAL_UNITS = new Set<DoseUnit>(['application', 'capsule', 'drop', 'pump', 'spray']);

export function formatDoseUnit(unit: DoseUnit, amount?: number) {
  const label = UNIT_LABELS[unit] ?? unit;
  if (amount !== undefined && amount !== 1 && PLURAL_UNITS.has(unit)) {
    return `${label}s`;
  }
  return label;
}

export function formatDoseAmount(amount: number, unit: DoseUnit) {
  if (!amount || amount <= 0) return 'Set amount';
  return `${amount} ${formatDoseUnit(unit, amount)}`;
}
