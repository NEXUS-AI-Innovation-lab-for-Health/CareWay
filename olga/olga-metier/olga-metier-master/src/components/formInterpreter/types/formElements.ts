import z from "zod";
import { el_checkbox_edit, el_datepicker_edit, el_dicom_edit, el_email_edit, el_file_edit, el_inputText_edit, el_inputText_view, el_notice_edit, el_numberInput_edit, el_section_edit, el_select_edit, el_select_view, el_textarea_edit, FormElementEventKeySchema, FormElementSchema, type FormElementsTypes } from "./formElementSchemas";
import type { IconType } from "react-icons";
import { IoMdArrowDropdownCircle } from "react-icons/io";
import { LuContainer, LuLetterText } from "react-icons/lu";
import { FaMicroscope } from "react-icons/fa";
import { MdAttachFile, MdCheckBox, MdDateRange, MdEmail, MdNotes, MdNumbers } from "react-icons/md";


export const FormElementCategoriesSchema = z.enum(['Inputs', 'Content', 'Show', 'Containers', "Special", 'Uploads'])
export type FormElementCategories = z.infer<typeof FormElementCategoriesSchema>


export const ElementDescSchema = z.object({
    content: z.object({
        edit: z.custom<typeof FormElementSchema.options[number]>(),
        view: z.custom<typeof FormElementSchema.options[number]>().nullable()
    }),
    label: z.string(),
    icon: z.custom<IconType>(),
    defaultData: z.any(),
    category: FormElementCategoriesSchema,

    events: z.object({
        edit: z.array(FormElementEventKeySchema),
        view: z.array(FormElementEventKeySchema)
    }).optional(),
})

export type ElementDesc = z.infer<typeof ElementDescSchema>

export const FormElementsDescs = {
    'select': {
        defaultData: '',
        category: 'Content',
        content: {
            edit: el_select_edit,
            view: el_select_view,
        },
        icon: IoMdArrowDropdownCircle,
        label: "Select",
        events: {
            edit: ["onChange"],
            view: [],
        }
    },
    "input:number": {
        category: 'Inputs',
        content: {
            edit: el_numberInput_edit,
            view: null
        },
        defaultData: '',
        icon: MdNumbers,
        label: "Input Number",
        events: {
            edit: ["onChange"],
            view: [],
        }
    },
    'input:text': {
        category: 'Inputs',
        content: {
            edit: el_inputText_edit,
            view: el_inputText_view
        },
        defaultData: '',
        icon: LuLetterText,
        label: "Input Text",
        events: {
            edit: ["onChange"],
            view: [],
        }
    },
    'notice': {
        category: "Show",
        content: {
            edit: el_notice_edit,
            view: null,
        },
        defaultData: '',
        icon: LuLetterText,
        label: "Notice"
    },
    'section': {
        category: "Containers",
        content:
        {
            edit: el_section_edit,
            view: null
        },
        defaultData: [],
        icon: LuContainer,
        label: "Section",
    },
    'textarea': {
        category: "Inputs",
        content: {
            edit: el_textarea_edit,
            view: null
        },
        defaultData: "",
        icon: MdNotes,
        label: "Text area"
    },
    'datepicker': {
        category: "Inputs",
        content: {
            edit: el_datepicker_edit,
            view: null
        },
        icon: MdDateRange,
        defaultData: "",
        label: "Date Picker"
    },
    'email': {
        category: "Inputs",
        content: {
            edit: el_email_edit,
            view: null
        },
        icon: MdEmail,
        defaultData: "",
        label: "Email"
    },
    'checkbox': {
        category: "Inputs",
        content: {
            edit: el_checkbox_edit,
            view: null
        },
        icon: MdCheckBox,
        defaultData: false,
        label: "Checkbox"
    },
    'file': {
        category: "Uploads",
        content: {
            edit: el_file_edit,
            view: null
        },
        icon: MdAttachFile,
        defaultData: false,
        label: "File Upload"
    },
    'dicom': {
        category: "Special",
        content: {
            edit: el_dicom_edit,
            view: null
        },
        icon: FaMicroscope,
        defaultData: [],
        label: 'Dicom',
    }
} as const satisfies Record<FormElementsTypes, ElementDesc>


export type AllElementDescs = typeof FormElementsDescs

