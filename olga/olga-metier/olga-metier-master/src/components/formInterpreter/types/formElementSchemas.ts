import { v4 } from "uuid";
import z from "zod";

export const FormElementEventKeySchema = z.enum(['onChange'])
export type FormElementEventKey = z.infer<typeof FormElementEventKeySchema>

export const FormElementEventSchema = z.object({
    onChange: z.array(
        z.union([z.object({
            action: z.literal("Set Value"),
            source: z.union([
                z.object({
                    key: z.string(),
                    value: z.literal('Key')
                }), z.object({
                    text: z.string(),
                    value: z.literal('Custom Text')
                }),
                z.object({
                    modelKey: z.string(),
                    value: z.literal('Model')
                })
            ]),
            target_key: z.string(),
        }),

        z.object({
            action: z.literal("Set Multiple Values"),
            content: z.array(z.object({
                sourceKey: z.string(),
                targetKey: z.string(),
            }))
            // source: z.union([
            //     z.object({
            //         key: z.string(),
            //         value: z.literal('Key')
            //     }), z.object({
            //         text: z.string(),
            //         value: z.literal('Custom Text')
            //     })
            // ]),
            // target_key: z.string(),
        }),
        ]))
})


// z.record(FormElementEventKeySchema, z.union([z.object()]))

export type FormElementEvent = z.infer<typeof FormElementEventSchema>

export const FormElementsTypesSchema = z.enum(['select', 'input:text', 'notice', 'dicom', 'section', 'textarea', 'email', 'input:number', 'datepicker',
    'checkbox', 'file'])
export type FormElementsTypes = z.infer<typeof FormElementsTypesSchema>

export const FormElementModesSchema = z.enum(['edit', 'view'])
export type FormElementModes = z.infer<typeof FormElementModesSchema>


export const FormeElementFieldOptionsSchema = z.union([z.object({
    source: z.literal('Text Option'),
    options: z.array(z.object({
        label: z.string(),
    }))
}), z.object({
    source: z.literal('Collections'),
    collection_source: z.string()
}),
z.object({
    source: z.literal('Model Options'),
    modelKey: z.string(),
    showKey: z.string(),
    options: z.array(z.any())
})
])

export type FormeElementFieldOptions = z.infer<typeof FormeElementFieldOptionsSchema>

export const FormElementBaseSchema = z.object({
    unique_id: z.string().default(() => v4()),
    field_key: z.string(),
    field_label: z.string(),
    field_hint: z.string(),
    field_required: z.boolean(),
})

export const el_inputText_edit = FormElementBaseSchema.extend({
    field_type: z.literal("input:text" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes),
    field_events: FormElementEventSchema,
})

export const el_inputText_view = FormElementBaseSchema.extend({
    field_type: z.literal("input:text" satisfies FormElementsTypes),
    field_mode: z.literal("view" satisfies FormElementModes),
}).omit({ field_hint: true, field_required: true })


export const el_select_view = FormElementBaseSchema.extend({
    field_type: z.literal("select" satisfies FormElementsTypes),
    field_mode: z.literal("view" satisfies FormElementModes),
}).omit({ field_required: true })

export const el_select_edit = FormElementBaseSchema.extend({
    field_options: FormeElementFieldOptionsSchema,
    field_events: FormElementEventSchema,
    field_type: z.literal("select" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
})

export const el_notice_edit = FormElementBaseSchema.extend({
    field_type: z.literal("notice" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
}).omit({ field_key: true, field_hint: true, field_required: true, })

export const el_textarea_edit = FormElementBaseSchema.extend({
    field_type: z.literal("textarea" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
})

export const el_numberInput_edit = FormElementBaseSchema.extend({
    field_type: z.literal("input:number" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
})

export const el_datepicker_edit = FormElementBaseSchema.extend({
    field_type: z.literal("datepicker" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
}).omit({ field_hint: true })

export const el_checkbox_edit = FormElementBaseSchema.extend({
    field_type: z.literal("checkbox" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
}).omit({ field_hint: true, field_required: true })


export const el_file_edit = FormElementBaseSchema.extend({
    field_type: z.literal("file" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes)
}).omit({ field_hint: true })


export const el_dicom_edit = FormElementBaseSchema.extend({
    field_type: z.literal("dicom" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes),
    orthanc_url: z.string(),
}).omit({ field_hint: true, field_required: true, field_label: true })

export const el_email_edit = FormElementBaseSchema.extend({
    field_type: z.literal("email" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes),
})



export const FormElementInSectionSchema = z.union([el_inputText_edit, el_select_view, el_select_edit, el_numberInput_edit, el_datepicker_edit, el_checkbox_edit,
    el_inputText_view, el_notice_edit, el_dicom_edit, el_textarea_edit, el_file_edit, el_email_edit])

export const el_section_edit = FormElementBaseSchema.extend({
    field_type: z.literal("section" satisfies FormElementsTypes),
    field_mode: z.literal("edit" satisfies FormElementModes),
    field_children: z.array(FormElementInSectionSchema)
}).omit({ field_key: true, field_hint: true, field_required: true, })

export const FormElementSchema = z.union([el_inputText_edit, el_select_view, el_select_edit, el_numberInput_edit, el_datepicker_edit, el_checkbox_edit,
    el_inputText_view, el_notice_edit, el_dicom_edit, el_section_edit, el_textarea_edit, el_file_edit, el_email_edit])
export type FormElement = z.infer<typeof FormElementSchema>


