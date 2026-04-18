/**
 * GET /api/skills — public list of all available skills.
 * Used by the talent submission form to populate the skills dropdown.
 */
import { skillRepository } from "@/repositories";
import { withErrorHandling } from "@/lib/handle-route";
import { single } from "@/lib/response";

export const GET = withErrorHandling(async () => {
  const skills = await skillRepository.findAll();
  return single(skills);
});
