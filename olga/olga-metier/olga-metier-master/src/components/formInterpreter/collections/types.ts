import z from "zod";

export const CollectionSchema = z.object({
    label : z.string(),
    id : z.string(),
    models : z.array(z.string())
})



export type Collection = z.infer<typeof CollectionSchema>