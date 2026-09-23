import z from "zod";
import { FormElementSchema } from "./formElementSchemas";

export const FormShowSchema = z.object({
    form_label: z.string(),
    form_id: z.string(),
})

export type FormShow = z.infer<typeof FormShowSchema>


export const FormSchema = z.object({
    form_id: z.string(),
    form_label: z.string(),
    form_version: z.string(),
    last_updated: z.string(),
    form_category: z.enum(['protocol']),
    form: z.array(FormElementSchema),
    models : z.array(z.string()),
})

export type Form = z.infer<typeof FormSchema>