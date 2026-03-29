import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import type { FormElement, FormElementEventKey } from "./types/formElementSchemas"
import { FormElementsDescs } from "./types/formElements"
import { capitalize, lowerCase } from "lodash"
import { Checkbox, DatePicker, Input, Select, SelectItem, Textarea } from "@heroui/react"
import { GeneratePreviewData } from "./utils"
import type { Form } from "./types/type"
import DicomViewer from "./formElements/DicomViewer"
import { useCollectionData } from "./collections/hooks"
import { MdEmail, MdNumbers } from "react-icons/md"

const ElementInterpreter = ({ element, isDisabled, data, onChange, allData, onGlobalChange, setChildrenEditor }:
    {
        setChildrenEditor?: Dispatch<SetStateAction<ReactNode>>, element: FormElement, isDisabled: boolean, data: any,
        onChange: (value: any) => void, allData: any, onGlobalChange: (key: string, value: any) => void
    }) => {
    const elementDesc = FormElementsDescs[element.field_type]

    //events 
    const todo: Record<FormElementEventKey, Array<Function>> = {
        'onChange': []
    }

    const collectionData = useMemo(() => {
        if (element.field_type != "select" || element.field_mode != 'edit' || element.field_options.source != "Collections") return null
        const collection = useCollectionData({ collectionId: element.field_options.collection_source })
        if (!collection) return null
        return collection.data.map(e => e.id)
    }, [element])


    if ('events' in elementDesc) {
        if (element.field_mode in elementDesc.events) {
            const onChange = elementDesc.events[element.field_mode].find(e => e == 'onChange')
            if (onChange) {
                if ('field_events' in element && 'onChange' in element.field_events) {
                    element.field_events.onChange.map(e => {
                        if (e.action == 'Set Value' && e.target_key != '' && allData[e.target_key] != null && allData[e.target_key] != undefined) {
                            if (e.source.value == 'Key') {
                                todo.onChange.push((value: any, key: any) => {
                                    if (e.source.value == 'Key') {
                                        if (key) onGlobalChange(e.target_key, value[key])
                                        else if (e.source.key == element.field_key) onGlobalChange(e.target_key, value)
                                        else onGlobalChange(e.target_key, allData[e.source.key])
                                    }
                                })
                            }
                            else if (e.source.value == 'Custom Text') {
                                todo.onChange.push(() => {
                                    if (e.source.value == 'Custom Text') {
                                        onGlobalChange(e.target_key, e.source.text)
                                    }
                                })
                            }
                            else if (e.source.value == "Model") {
                                todo.onChange.push((json: any) => {
                                    if (e.source.value == "Model") {
                                        onGlobalChange(e.target_key, json[e.source.modelKey])
                                    }
                                })
                            }
                        }
                    })
                }
            }
        }
    }

    if (element.field_type == 'input:text') {
        if (element.field_mode == 'edit') {
            return <Input
                onValueChange={(value: string) => {
                    onChange(value)
                    todo.onChange.map(fn => fn(value))
                }} classNames={{ inputWrapper: 'bg-white' }}
                isDisabled={isDisabled} radius="lg" isClearable className="dark:text-zinc-200 capitalize"
                value={data}
                placeholder={element.field_hint && element.field_hint != '' ? element.field_hint : (element.field_label ? `Enter ${lowerCase(element.field_label)} ...` : 'Enter value ...')}
                size="sm" label={element.field_label || element.field_key || elementDesc.label} />
        } else {
            return <div className="w-full ps-1 flex gap-2"><p className="text-xs dark:text-zinc-400 text-zinc-700 tracking-wider">{element.field_label.length > 0 ? element.field_label
                : (element.field_key.length > 0 ? capitalize(element.field_key) : elementDesc.label)} : </p>
                <p className="text-xs text-zinc-950 dark:text-zinc-200 tracking-wider">{data == '' || !data ? 'Some value' : data}</p>
            </div>

        }
    }

    if (element.field_type == 'select') {
        if (element.field_mode == 'edit') {
            return <Select placeholder={element.field_hint} isDisabled={isDisabled} radius="lg"
                label={element.field_label && element.field_label.length > 0 ? element.field_label : capitalize(element.field_type)} classNames={{ 'trigger': 'bg-white' }}
                value={data} onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0]
                    if (element.field_options.source == "Model Options") {
                        if (onChange) onChange(element.field_options.options[Number(value) as number][element.field_options.showKey])
                        todo.onChange.map(fn => {
                            if (element.field_options.source == "Model Options") fn(element.field_options.options[Number(value) as number], element.field_options.showKey)
                        })
                    }

                    else {
                        if (onChange) onChange(value)
                        todo.onChange.map(fn => fn(value))
                    }
                }}>

                {(() => {
                    let options: Array<string> = []
                    if (element.field_options.source == 'Text Option') options = element.field_options.options.map(e => e.label)
                    if (element.field_options.source == 'Model Options') {
                        const showKey = element.field_options.showKey
                        options = element.field_options.options.map(e => e[showKey])
                    }

                    if (element.field_options.source == "Collections" && collectionData != null) {
                        return collectionData.map((e, i) => <SelectItem key={i} >{e}</SelectItem>)
                    }

                    if (element.field_options.source == "Model Options") {
                        return options.map((e, i) => <SelectItem key={i} >{e}</SelectItem>)
                    }
                    return options.map((e) => <SelectItem key={e} >{e}</SelectItem>)

                })()}
            </Select>
        }
    }

    if (element.field_type == 'dicom') {
        if (element.field_mode == 'edit') {
            return <><DicomViewer isDisabled={isDisabled}
                orthancUrl={element.orthanc_url} setRender={setChildrenEditor} enabled={!isDisabled} onSaveImage={(image: string) => {
                    if (typeof data == 'string') data = image
                    if (Array.isArray(data)) data = [...data, image]
                    onChange(data)
                }} images={data} />
            </>
        }
    }

    if (element.field_type == "checkbox") {
        return <Checkbox isDisabled={isDisabled} onValueChange={onChange} className="my-0.5" classNames={{ label: "text-sm" }} isSelected={data}>{element.field_label && element.field_label.length > 0 ? element.field_label :
            <p className="text-xs text-warning">Some value</p>}</Checkbox>;
    }

    if (element.field_type == "textarea") {
        return <Textarea label={element.field_label || element.field_key || elementDesc.label} isClearable value={data} isDisabled={isDisabled} isRequired={element.field_required}
            placeholder={element.field_hint && element.field_hint != '' ? element.field_hint : (element.field_label ? `Enter ${lowerCase(element.field_label)} ...` : 'Enter value ...')}
            onValueChange={onChange} classNames={{ inputWrapper: 'bg-white' }} />
    }

    if (element.field_type == "datepicker") {
        return <DatePicker isDisabled={isDisabled} isRequired={element.field_required} size="sm" classNames={{ "inputWrapper": "bg-white" }} label={element.field_label || element.field_key || elementDesc.label} />
    }

    if (element.field_type == "email") {
        return <Input
            type="email"
            isRequired={element.field_required}
            startContent={<MdEmail />}
            onValueChange={(value: string) => {
                onChange(value)
                todo.onChange.map(fn => fn(value))
            }} classNames={{ inputWrapper: 'bg-white' }}
            isDisabled={isDisabled} radius="lg" isClearable className="dark:text-zinc-200 capitalize"
            value={data}
            placeholder={element.field_hint && element.field_hint != '' ? element.field_hint : (element.field_label ? `Enter ${lowerCase(element.field_label)} ...` : 'Enter value ...')}
            size="sm" label={element.field_label || element.field_key || elementDesc.label} />
    }

    if (element.field_type == "input:number") {
        return <Input
            type="number"
            isRequired={element.field_required}
            startContent={<MdNumbers />}
            onValueChange={(value: string) => {
                onChange(value)
                todo.onChange.map(fn => fn(value))
            }} classNames={{ inputWrapper: 'bg-white' }}
            isDisabled={isDisabled} radius="lg" isClearable className="dark:text-zinc-200 capitalize"
            value={data}
            placeholder={element.field_hint && element.field_hint != '' ? element.field_hint : (element.field_label ? `Enter ${lowerCase(element.field_label)} ...` : 'Enter value ...')}
            size="sm" label={element.field_label || element.field_key || elementDesc.label} />
    }
}


export default function FormPreview({
    form,
    data,
    isDisabled,
    setData
}: {
    form: Form
    isDisabled: boolean
    data?: any
    setData?: (data: any) => void
}) {
    const [emptyData, setEmptyData] = useState<any>(null)
    const [childrenEditor, setChildrenEditor] = useState<ReactNode | null>(null)

    const isControlled = data !== undefined
    const shouldEmit = typeof setData === "function"


    useEffect(() => {
        if (!isControlled) {
            const initial = GeneratePreviewData(form)
            setEmptyData(initial)

            if (shouldEmit) {
                setData?.(initial)
            }
        }
    }, [form.form])


    const currentData = isControlled ? data : emptyData


    const updateData = (key: string, value: any) => {
        if (isControlled) {

            setData?.({
                ...data,
                [key]: value
            })
        } else {

            setEmptyData((prev: any) => {
                const next = { ...prev, [key]: value }


                if (shouldEmit) {
                    setData?.(next)
                }

                return next
            })
        }
    }

    if (!form || !currentData) return null

    return (
        <div className="flex items-center w-full gap-6 justify-center h-full">
            <div className="flex h-full gap-1.5 w-full max-w-[500px] mx-auto flex-col">
                <div className="flex flex-col">
                    <p className="text-sm ps-1 font-bold dark:text-zinc-300 tracking-widest">
                        {form.form_label
                            ? form.form_label
                            : <span className="text-danger font-light">No form label</span>}
                    </p>

                    <p className="text-[10px] ps-1 text-zinc-800 dark:text-zinc-400 tracking-widest">
                        Form ID :
                        {form.form_id
                            ? <span className="text-primary font-bold"> {form.form_id}</span>
                            : <span className="text-danger"> No form id</span>}
                    </p>

                    <p className="text-[10px] ps-1 text-zinc-600 mt-1 underline tracking-widest">
                        Content :
                    </p>
                </div>

                {form.form.map((element, index) => (
                    <ElementInterpreter
                        key={index}
                        element={element}
                        isDisabled={isDisabled}
                        setChildrenEditor={setChildrenEditor}
                        data={
                            "field_key" in element
                                ? currentData[element.field_key]
                                : null
                        }
                        allData={currentData}
                        onChange={(value) => {
                            if ("field_key" in element) {
                                updateData(element.field_key, value)
                            }
                        }}
                        onGlobalChange={(key, value) => {
                            updateData(key, value)
                        }}
                    />
                ))}
            </div>

            {childrenEditor && (
                <div className="w-full h-full">
                    {childrenEditor}
                </div>
            )}
        </div>
    )
}