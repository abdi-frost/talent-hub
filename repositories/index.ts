/**
 * Barrel export — import all repositories from a single path.
 *
 * Usage:
 *   import { talentRepository, skillRepository } from "@/repositories";
 */
export { talentRepository } from "./talent.repository";
export { adminRepository } from "./admin.repository";
export { statsRepository } from "./stats.repository";
export { skillRepository } from "./skill.repository";
export { primarySkillRepository } from "./primary-skill.repository";

// Re-export useful types
export type { TalentListFilters } from "./talent.repository";
