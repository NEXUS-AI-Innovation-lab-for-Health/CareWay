import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { IoContrastOutline } from "react-icons/io5";
import { LuZoomIn } from "react-icons/lu";
import { FaRuler } from "react-icons/fa";
import { FaRegCircle } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useState, type ReactNode } from "react";
import { ToolsBindings } from "./DicomToolManager";
import { GrPan } from "react-icons/gr";
import type { ToolsKeys } from "./types";
import type { IconType } from "react-icons";
const measurementElements = {
    'circle': {
        label: "Circle",
        icon: FaRegCircle
    },
    "ruler": {
        label: "Ruler",
        icon: FaRuler
    }
} as const satisfies Partial<Record<ToolsKeys, {label : string, icon : IconType}>>

export default ({ selectedTools = [], onChange, onSaveImage } : {selectedTools : Array<ToolsKeys>, onChange : (updatedTools : ToolsKeys[])=>void,  onSaveImage : ()=>void}) => {

    const [selectedMeasurementTool, setSelectedMeasurementTool] = useState<keyof typeof measurementElements>('circle')

    const toggleTool = (key : ToolsKeys) => {
        const binding = ToolsBindings[key];
        const isSelected = selectedTools.includes(key);

        let updatedTools;

        if (isSelected) {
            updatedTools = selectedTools.filter(tool => tool !== key);
        } else {
            updatedTools = selectedTools
                .filter(tool => ToolsBindings[tool] !== binding);
            updatedTools.push(key);
        }

        if (onChange) onChange(updatedTools);
    };

    const activateTool = (key : ToolsKeys) => {
        const binding = ToolsBindings[key];
        const updatedTools = selectedTools
            .filter(tool => ToolsBindings[tool] !== binding);
        updatedTools.push(key);
        if (onChange) onChange(updatedTools);
    };

    const SelectedMeasurementIcon = measurementElements[selectedMeasurementTool].icon

    return <div className="flex gap-2 items-center">
        <div className="w-full bg-white border-zinc-200  dark:bg-zinc-950 border-2 dark:border-zinc-800 rounded-full p-1 flex items-center justify-between h-full">
            <p className="text-xs p-2 tracking-widest font-bold text-zinc-900 dark:text-zinc-200 px-4 bg-zinc-200 dark:bg-zinc-900 h-full  rounded-full">Tools</p>

            <div className="flex items-center gap-1">
                <div className="flex rounded-xl overflow-hidden intes-center bg-zinc-200 dark:bg-zinc-900">
                    <Button onPress={() => toggleTool(selectedMeasurementTool)} radius='none' color="primary" className={` ${selectedTools.includes(selectedMeasurementTool) ? '' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                        isIconOnly size="sm" >{<SelectedMeasurementIcon className={` ${selectedTools.includes(selectedMeasurementTool) ? '!text-white dark:!text-black' : '!text-black dark:!text-white'}`} />}</Button>
                    <Dropdown backdrop="blur" radius="lg" className="bg-zinc-200 dark:bg-zinc-800 !p-0.5 !min-w-10 w-fit" size="sm">
                        <DropdownTrigger>
                            <Button  className="!bg-zinc-200 dark:!bg-zinc-900 !min-w-0 w-6" isIconOnly size="sm" ><MdKeyboardArrowDown size={16} /></Button>
                        </DropdownTrigger>
                        <DropdownMenu onAction={(key ) => {
                            const keyCasted = key as  keyof typeof measurementElements
                            setSelectedMeasurementTool(keyCasted)
                            if (!selectedTools.includes(keyCasted)) activateTool(keyCasted)
                        }} classNames={{ "base": "!w-fit" }} className="!w-fit" aria-label="Static Actions">
                            {Object.keys(measurementElements).map(key => {
                                  const keyCasted = key as  keyof typeof measurementElements
                                  const Icon = measurementElements[keyCasted].icon
                                return <DropdownItem  startContent={<Icon className="!text-black dark:!text-black" />}  key={key}>
                                <p className="dark:text-zinc-200 text-zinc-800 text-xs font-bold tracking-widest">{measurementElements[keyCasted].label}</p></DropdownItem>
                            })}

                        </DropdownMenu>
                    </Dropdown>
                </div>
                <Button onPress={() => toggleTool('pan')} radius="full" color="primary"
                    className={` ${selectedTools.includes('pan') ? '' : 'bg-zinc-200 dark:bg-zinc-800'}`} size="sm" isIconOnly>
                        <GrPan className={` ${selectedTools.includes('pan') ? "text-white" : "text-zinc-800"} dark:text-white `} size={16} /></Button>
                <Button onPress={() => toggleTool('level')} radius="full" color="primary"
                    className={` ${selectedTools.includes('level') ? '' : 'bg-zinc-200 dark:bg-zinc-800'}`} size="sm" isIconOnly>
                        <IoContrastOutline className={` ${selectedTools.includes('level') ? "text-white" : "text-zinc-800"} dark:text-white `} size={16} /></Button>
                <Button onPress={() => toggleTool('zoom')} radius="full" color="primary"
                    className={` ${selectedTools.includes('zoom') ? '' : 'bg-zinc-200 dark:bg-zinc-800'}`} size="sm" isIconOnly>
                        <LuZoomIn className={` ${selectedTools.includes('zoom') ? "text-white" : "text-zinc-800"} dark:text-white `}  size={18} /></Button>
            </div>

        </div>

        <div className="bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-full p-1">
            <Button onPress={() => { if (onSaveImage) onSaveImage() }} size="sm" radius="full" className="tracking-widest " variant="solid" color="success">Save image</Button>
        </div>
    </div>
}