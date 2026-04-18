import z from "zod";

export const globalStackitSchema = z.object({
  dependencies: z.record(z.url().describe("The URL of the dependency."), z.object({
    selectedBranch: z.string().optional().describe("The selected branch of the dependency."),
    selectedTag: z.string().optional().describe("The selected tag of the dependency."),
    usedIn: z.array(z.string()).describe("The projects paths that use the dependency."),
  }).superRefine((data, ctx) => {
    if (data.selectedBranch && data.selectedTag) {
      ctx.addIssue({
        code: "custom",
        message: "Only one of selectedBranch or selectedTag can be provided.",
      });
    }
    if (!data.selectedBranch && !data.selectedTag) {
      ctx.addIssue({
        code: "custom",
        message: "One of selectedBranch or selectedTag must be provided.",
      });
    }
  })).describe("The dependencies of the global stackit."),
}).strict().describe("The global stackit configuration.");

export type GlobalStackit = z.infer<typeof globalStackitSchema>;