export interface FrustrationOption {
  id: string;
  label: string;
  description: string;
}

export const frustrations: FrustrationOption[] = [
  {
    id: 'scattered-notes',
    label: 'Scattered notes',
    description: 'Details live in screenshots, chats, saved posts, and memory.',
  },
  {
    id: 'conflicting-claims',
    label: 'Conflicting claims',
    description: 'Too much certainty online, not enough evidence context.',
  },
  {
    id: 'routine-drift',
    label: 'Routine drift',
    description: 'It is hard to see what changed, when, and why.',
  },
  {
    id: 'source-quality',
    label: 'Source quality',
    description: 'You want the library to separate research from hype.',
  },
  {
    id: 'tracking-fatigue',
    label: 'Tracking fatigue',
    description: 'Most tools ask for more detail than you can maintain.',
  },
];

export const frustrationById = frustrations.reduce<Record<string, FrustrationOption>>((lookup, frustration) => {
  lookup[frustration.id] = frustration;
  return lookup;
}, {});
