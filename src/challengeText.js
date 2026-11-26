// Presentation only: keep targets and stored progress unchanged.
export function challengeText(target, description = '') {
  if (target == null) return 'Target not verified';
  const desc = String(description).trim();
  const repetitions = /\s*\(repetitions\)\s*$/i;
  if (repetitions.test(desc)) return `${desc.replace(repetitions, '')} - ${target} ${target === 1 ? 'time' : 'times'}`;
  if (/^Reach Prestige Master level$/i.test(desc)) return `${desc} ${target}`;
  if (/^Reach Weapon Prestige 1$/i.test(desc)) return desc;
  return `${target} ${desc}`.trim();
}
