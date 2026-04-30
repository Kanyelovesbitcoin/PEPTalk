import type { Compound } from '@/types/compound';

export const compounds: Compound[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    nickname: 'Body Protective Compound',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'promising',
    goals: ['recovery', 'vitality'],
    administrationRoutes: ['oral', 'injection'],
    summary: 'Studied for tissue repair, gut integrity, and faster recovery.',
    whatIsIt:
      'A 15-amino-acid fragment isolated from gastric juice. Known in performance circles for accelerating soft-tissue repair.',
    whatIsItGoodFor: [
      'Faster recovery from training',
      'Joint and tendon support',
      'Gut integrity',
    ],
    howDoesItWork:
      'Modulates growth factors and angiogenesis to push repair forward where the body would otherwise stall.',
    thingsToKnow: [
      'Strong animal data, limited human RCTs.',
      'Sourcing matters — purity varies widely.',
      'Educational only, not medical advice.',
    ],
    budgetTier: 'mid',
    legalStatus: 'research',
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    nickname: 'Thymosin Beta-4',
    type: 'peptide',
    difficulty: 'intermediate',
    researchStatus: 'promising',
    goals: ['recovery', 'vitality'],
    administrationRoutes: ['injection'],
    summary: 'Cellular repair signal — discussed for systemic recovery and resilience.',
    whatIsIt:
      'A synthetic version of a naturally occurring repair peptide. Used by athletes for stubborn soft-tissue rebuilds.',
    whatIsItGoodFor: [
      'Soft-tissue repair',
      'Recovery from chronic strain',
      'Resilience under load',
    ],
    howDoesItWork:
      'Promotes cell migration and new blood vessel formation, clearing the way for repair.',
    thingsToKnow: [
      'Injection-only.',
      'Costly versus simpler beginner peptides.',
      'Human evidence still emerging.',
    ],
    budgetTier: 'high',
    legalStatus: 'research',
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295',
    nickname: 'GH Releasing Hormone Analog',
    type: 'peptide',
    difficulty: 'intermediate',
    researchStatus: 'promising',
    goals: ['vitality', 'aesthetic', 'sleep'],
    administrationRoutes: ['injection'],
    summary: 'GH signaling — paired with Ipamorelin for body composition and recovery.',
    whatIsIt:
      'A long-acting GHRH analog that nudges the pituitary to release more growth hormone in a natural pulsatile pattern.',
    whatIsItGoodFor: [
      'Lean body composition',
      'Deeper sleep quality',
      'Skin elasticity over time',
    ],
    howDoesItWork:
      'Lifts baseline GH pulses without flooding the system, supporting recovery and tissue maintenance.',
    thingsToKnow: [
      'Almost always stacked with Ipamorelin.',
      'Injection-based protocol.',
      'Hype outpaces long-term human data.',
    ],
    budgetTier: 'high',
    legalStatus: 'research',
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    nickname: 'Selective GH Secretagogue',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'promising',
    goals: ['vitality', 'sleep', 'recovery'],
    administrationRoutes: ['injection'],
    summary: 'Clean GH pulse — favored for sleep, recovery, and body composition.',
    whatIsIt:
      'A selective ghrelin-mimetic that triggers GH release without spiking cortisol or prolactin.',
    whatIsItGoodFor: [
      'Sleep quality',
      'Recovery between sessions',
      'A cleaner entry to GH-support stacks',
    ],
    howDoesItWork:
      'Activates the GH-release pathway selectively, leaving stress hormones untouched.',
    thingsToKnow: [
      'Subcutaneous injection.',
      'Best paired with CJC-1295.',
      'Long-term human data still developing.',
    ],
    budgetTier: 'mid',
    legalStatus: 'research',
  },
  {
    id: 'selank',
    name: 'Selank',
    nickname: 'The Calm Nootropic',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'promising',
    goals: ['sharpness', 'energy'],
    administrationRoutes: ['nasal'],
    summary: 'Nasal peptide studied for calm focus and reduced anxiety.',
    whatIsIt:
      'A synthetic analog of tuftsin developed in Russia. Used as a calm-focus nootropic with anxiolytic edge.',
    whatIsItGoodFor: [
      'Sharper focus under pressure',
      'Lower baseline anxiety',
      'Stable mood through demanding stretches',
    ],
    howDoesItWork:
      'Modulates GABA, dopamine, and serotonin signaling without sedation.',
    thingsToKnow: [
      'Nasal spray — fast onset.',
      'Most clinical work is from Russian labs.',
      'Cycle, do not use indefinitely.',
    ],
    budgetTier: 'mid',
    legalStatus: 'research',
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    nickname: 'The Longevity Tetrapeptide',
    type: 'peptide',
    difficulty: 'advanced',
    researchStatus: 'early-research',
    goals: ['vitality', 'sleep'],
    administrationRoutes: ['injection'],
    summary: 'Telomerase-associated peptide studied for cellular renewal.',
    whatIsIt:
      'A four-amino-acid peptide developed for telomere maintenance research. The flagship name in longevity peptide circles.',
    whatIsItGoodFor: [
      'Long-horizon vitality protocols',
      'Sleep architecture support',
      'Stacked with GH peptides for advanced users',
    ],
    howDoesItWork:
      'Linked to telomerase activation in cell models, with downstream effects on circadian and pineal function.',
    thingsToKnow: [
      'Advanced — not a starter peptide.',
      'Human data is sparse; animal data drives the hype.',
      'Cycled, not chronic.',
    ],
    budgetTier: 'high',
    legalStatus: 'research',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    nickname: 'Copper Tripeptide-1',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'promising',
    goals: ['aesthetic', 'recovery'],
    administrationRoutes: ['topical', 'injection'],
    summary: 'Gold-standard topical for collagen, firmness, and visible skin renewal.',
    whatIsIt:
      'A naturally occurring copper-binding peptide. The most-studied topical signal peptide on the market.',
    whatIsItGoodFor: [
      'Visible skin firmness',
      'Hair density support',
      'Topical recovery routines',
    ],
    howDoesItWork:
      'Activates collagen, elastin, and antioxidant gene expression in the skin matrix.',
    thingsToKnow: [
      'Topical forms are legal cosmetic.',
      'Strength varies by formulation.',
      'Stable in serum, sensitive to oxidizers.',
    ],
    budgetTier: 'mid',
    legalStatus: 'cosmetic',
  },
  {
    id: 'matrixyl',
    name: 'Matrixyl 3000',
    nickname: 'Palmitoyl Tripeptide-38',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'well-studied',
    goals: ['aesthetic'],
    administrationRoutes: ['topical'],
    summary: 'Signal peptide for collagen and hyaluronic acid synthesis.',
    whatIsIt:
      'A topical peptide complex with a long clinical track record for visible firmness gains.',
    whatIsItGoodFor: [
      'Fine line softening',
      'Skin elasticity',
      'Daily aesthetic routines',
    ],
    howDoesItWork:
      'Signals fibroblasts to up-regulate collagen and HA synthesis in the dermal matrix.',
    thingsToKnow: [
      'Effects compound over 8–12 weeks.',
      'Look for 2–8% formulations.',
      'Skip simultaneously with strong acids.',
    ],
    budgetTier: 'low',
    legalStatus: 'cosmetic',
  },
  {
    id: 'argireline',
    name: 'Argireline',
    nickname: 'Acetyl Hexapeptide-8',
    type: 'peptide',
    difficulty: 'beginner',
    researchStatus: 'well-studied',
    goals: ['aesthetic'],
    administrationRoutes: ['topical'],
    summary: 'Topical peptide that softens expression lines from movement.',
    whatIsIt:
      'A topical hexapeptide that calms repetitive expression lines without injections.',
    whatIsItGoodFor: [
      'Forehead and eye-area lines',
      'Non-injection aesthetic routines',
      'Daily morning serums',
    ],
    howDoesItWork:
      'Mimics SNAP-25 to mute the muscle signal that drives dynamic lines.',
    thingsToKnow: [
      'Effects are subtle vs in-office treatments.',
      'Twice daily, consistent application.',
      'Best on dynamic lines, not static creases.',
    ],
    budgetTier: 'low',
    legalStatus: 'cosmetic',
  },
];

export const compoundById = compounds.reduce<Record<string, Compound>>((lookup, compound) => {
  lookup[compound.id] = compound;
  return lookup;
}, {});
