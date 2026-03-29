
import { v4 } from 'uuid'
import z from 'zod'

export const DataModelTypeSchema = z.enum(['string', 'integer', 'class'])

// export const DataModelFieldSchema = z.union([z.object({
//         label: z.string(), key : z.string(), type: DataModelTypesSchema
//     }), 
//     z.object({
//         label: z.string(), key : z.string(),type: z.literal('enum'), enumVals: z.array(z.string())
//     })])

export const DataModelFieldSchema = z.object({
    label: z.string(),
    key: z.string(),
    type: DataModelTypeSchema,
    class_id : z.string().optional(),
    class_label : z.string().optional(),
    data : z.any().optional(),
    unique_id: z.string().default(() => v4())
})


export const DataModelSchema = z.object({
    label: z.string(),
    id: z.string(),
    fields: z.array(DataModelFieldSchema)
})

export const DataModelMinimalSchema = DataModelSchema.omit({ fields: true })

export type DataModel = z.infer<typeof DataModelSchema>
export type DataModelField = z.infer<typeof DataModelFieldSchema>
export type DataModelType = z.infer<typeof DataModelTypeSchema>
export type DataModelMinimal = z.infer<typeof DataModelMinimalSchema>