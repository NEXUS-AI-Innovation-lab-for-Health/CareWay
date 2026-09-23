import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react"
import Navbar from "../components/Navbar"
import { FaCalendar } from "react-icons/fa"
import FormInterpreter from "../components/formInterpreter"
import { useState } from "react"
import { FormSchema, type Form } from "../components/formInterpreter/types/type"
import { useQuery } from "@tanstack/react-query"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

type TaskData = {
    [key: string]: any
}

const isRendezVous = (data?: TaskData | null) => {
    if (!data) return false

    return (
        data["medical.first_name"] != null &&
        data["medical.last_name"] != null
    )
}

export default () => {

    const [form, setForm] = useState<Form | null>(null)
    const [formData, setFormData] = useState<any>(null)
    const [taskID, setTaskId] = useState("")
    const [loading, setLoading] = useState(false)

    const { data, refetch } = useQuery({
        queryKey: ["onGoingTasks"],
        queryFn: async () => {
            const res = await fetch(BACKEND_URL + "/ongoing?inventory_id=test")
            if (!res.ok) throw new Error()
            const json = await res.json()

            return json
        }
    })

    return <div className="flex flex-col">
        <Navbar />
        <div className="flex-1 flex-col gap-5 pt-10 flex items-center justify-center ">
            <Button isDisabled={loading} onPress={async () => {
                setLoading(true)
                const res = await fetch(BACKEND_URL + "/startTask?inventory_id=test")
                try {
                    if (!res.ok) throw new Error()
                    const json = await res.json()
                    const form = FormSchema.parse(json.form)
                    setForm(form)
                    setTaskId(json.task_id)
                } catch {

                }
                setLoading(false)
            }}
                startContent={<FaCalendar />} color="primary" radius="full">Prendre rendez-vous</Button>


            <p className="font-bold mt-10 ">Mes rendez-vous </p>

            {data && data.map((task: any, index: number) => {
                if (!isRendezVous(task.data)) return null

          
                const {current_node_id} = task

                return (
                    <div
                        key={index}
                        className="
                w-full max-w-md
                p-4 rounded-2xl
                bg-gradient-to-br from-zinc-50 to-zinc-100
           
                shadow-sm
                transition-all
                hover:shadow-md hover:scale-[1.01]
                cursor-pointer
            "
                    >
                        <div className="flex items-center gap-3">
                            <div className="
                    flex items-center justify-center
                    w-10 h-10
                    rounded-full
                    bg-zinc-600 text-white
                ">
                                <FaCalendar size={16} />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-900">
                                    Rendez-vous en cours
                                </span>
                                <span className="text-xs text-zinc-700">
                                    {task.data["medical.first_name"]} · {task.data["medical.last_name"]}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                            <span className={`
                            ${current_node_id == null ? " bg-green-500" : "bg-zinc-200/60"}
                    text-xs font-medium
                    text-zinc-700
                 
                    px-2 py-1
                    rounded-full
                `}>
                     {current_node_id == null ? "Confirmé" : "En attente"}
                                
                            </span>
                        </div>
                    </div>
                )
            })}


            <Modal onClose={() => setForm(null)} className="bg-neutral-100" isOpen={form != null} >
                <ModalContent>
                    {(onClose) => (
                        <>{form != null && <>
                            <ModalHeader className="flex flex-col gap-1">Prise de rendez-vous</ModalHeader>
                            <ModalBody>
                                <FormInterpreter setData={setFormData} form={form} isDisabled={false} />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={async () => {
                                    console.log("data fr", formData);
                                    
                                    const res = await fetch(BACKEND_URL + "/next?task_id=" + taskID, {
                                        method: "POST",
                                        headers: {
                                            "content-type": "application/json"
                                        },
                                        body: JSON.stringify(formData)
                                    })
                                    try {
                                        if (!res.ok) throw new Error()
                                        const json = await res.json()
                                        const form = FormSchema.parse(json.form)
                                        setForm(form)
                                        setTaskId(json.task_id)
                                    } catch {

                                    }
                                    refetch()
                                    onClose()
                                }}>
                                    Next
                                </Button>
                            </ModalFooter></>}
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    </div>
}