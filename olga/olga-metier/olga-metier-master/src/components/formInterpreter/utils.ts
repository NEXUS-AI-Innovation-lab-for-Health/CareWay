import _ from "lodash"
import type { Form } from "./types/type"
import { FormElementsDescs } from "./types/formElements"
import  z from "zod"


export const GetEmptyForm = (): Form => {
  return {
    "form_id": "a33b3f32-1e4c-4686-9705-6ca67a381c33",
    "form_label": "",
    "form_version": "1.0.0",
    "last_updated": "2024-12-30",
    "form_category": "protocol",
    "form": [

    ],
    "models": [
        
    ]
}
}   
   
export function GeneratePreviewData(form: Form) {
  if (!form) return {}

  let data : any = {}
  form.form.map(element => {
      const elementDesc = FormElementsDescs[element.field_type]
      if('field_key' in element)data[element.field_key] = _.cloneDeep(elementDesc.defaultData)
  })
  return data
}


   
export function SafeGenerateEmptyFromZodSchema<T extends z.ZodType>(schema: T) : z.infer<T> | null {
  
  const data = GenerateEmptyFromZodSchema(schema)
  const dataParsed = schema.safeParse(data)
  if (!dataParsed.error) {
    return dataParsed.data
  }
  console.error(dataParsed.error)
  return null
}  
    
export function GenerateEmptyFromZodSchema(schema: z.ZodType): any {  
  if (schema instanceof z.ZodBoolean) return false;
  if (schema instanceof z.ZodNumber) return 0;
  if (schema instanceof z.ZodString) return "";
  if (schema instanceof z.ZodArray) return [];
  if (schema instanceof z.ZodEnum) return schema.options[0];
  if (schema instanceof z.ZodLiteral) return schema.value
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const result: Record<string, any> = {};
    for (const key in shape) {
      result[key] = GenerateEmptyFromZodSchema(shape[key]);
    }
    return result;
  }
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return null;
  }

    if (schema instanceof z.ZodUnion) {
    const options = schema.options as z.ZodTypeAny[];
    return GenerateEmptyFromZodSchema(options[0]);
  }

  // fallback
  return undefined;
}
    
// export const GenerateEmptyFromElementFormElementDesc = (desc : FormElementDesc, mode : 'view' | 'edit')=>{
//   const object : FormElement = {
//     field_type : desc.field_type as FormElementType,
//     field_key : null,
//     field_mode : mode
//   }
     
//   if(!desc.contents[mode]) return false  
//   desc.contents[mode].forEach((e)=>object[e.key] = _.cloneDeep(e.defaultValue))
//   return object
// }
     
// export function SafeGenerateEmptyFromZod<T extends ZodTypeAny>(schema: T): z.ZodSafeParseResult<z.core.output<T>> {
//   const data = GenerateEmptyFromZod(schema)
//   console.log(data);
     
//    const dataParsed = schema.safeParse(data)
//   return dataParsed
// } 
    
// export function GenerateEmptyFromZod<T extends ZodTypeAny>(schema: T): any {
//   if (schema instanceof z.ZodString) return "";
//   if (schema instanceof z.ZodNumber) return 0;
//   if (schema instanceof z.ZodBoolean) return false;
//   if (schema instanceof z.ZodArray) return [];
//   if (schema instanceof z.ZodEnum) return schema.options[0]
//   if (schema instanceof z.ZodLiteral) return schema.value
//   if (schema instanceof z.ZodObject) {
//     const shape = (schema as any).shape;
//     return Object.fromEntries(
//       Object.entries(shape).map(([k, v]) => [k, GenerateEmptyFromZod(v as ZodTypeAny)])
//     );
//   }
//   return null;
// }