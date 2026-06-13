import { Sport } from "@/generated/prisma/client";
import { z } from "zod";

/** API／表單：運動類型（註解：建隊時必填）。 */
export const sportFieldSchema = z.nativeEnum(Sport);
