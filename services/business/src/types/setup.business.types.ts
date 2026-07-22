import { z } from "zod";
import { setupBasicsSchema } from "../dtos/setup.business.dto";

// step1  - basics setup for different business types (hotel, salon, clinic)
export type SetupBasicsInput = z.infer<typeof setupBasicsSchema>["body"];
