import z from "zod";

export const projectStackitSchema = z.object({
  dependencies: z.record(z.string(), z.string()).describe("The dependencies of the project."),
  dir: z.string().describe("The directory of the project."),
}).strict().describe("The project stackit configuration.");


export type ProjectStackit = z.infer<typeof projectStackitSchema>;