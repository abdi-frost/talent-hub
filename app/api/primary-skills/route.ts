/**
 * GET /api/primary-skills — public list of all primary-skill categories.
 * Used by the talent submission form to populate the primary skill dropdown.
 */
import { primarySkillRepository } from "@/repositories";
import { withErrorHandling } from "@/lib/handle-route";
import { single } from "@/lib/response";

export const GET = withErrorHandling(async () => {
  const categories = await primarySkillRepository.findAll();
  return single(categories);
});
