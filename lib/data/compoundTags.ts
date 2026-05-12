import type { Compound, LegalStatus, ResearchStatus, RiskBadge } from '@/types/compound';

const LEGAL_TAGS: Record<LegalStatus, string> = {
  'approved-rx': 'Prescription context',
  cosmetic: 'Cosmetic topical',
  investigational: 'Investigational',
  research: 'Research-only',
};

const RESEARCH_TAGS: Record<ResearchStatus, string> = {
  'early-research': 'Early evidence',
  promising: 'Limited human data',
  'well-studied': 'Established context',
};

export function getDefaultCompoundTags(
  compound: Pick<Compound, 'legalStatus' | 'researchStatus'> & { riskBadges?: RiskBadge[]; tags?: string[] },
) {
  if (compound.tags?.length) {
    return compound.tags;
  }

  const tags = [
    LEGAL_TAGS[compound.legalStatus],
    RESEARCH_TAGS[compound.researchStatus],
    ...(compound.riskBadges ?? []).filter((badge) =>
      badge === 'FDA compounding concern' ||
      badge === 'WADA athlete caution' ||
      badge === 'Limited human data',
    ),
  ];

  return Array.from(new Set(tags)).slice(0, 4);
}
