import { useQuery } from "@tanstack/react-query"
import Navbar from "../components/Navbar"
import { FaCalendar } from "react-icons/fa"
import { RiArrowRightSLine } from "react-icons/ri"
import { useState } from "react"
import { FormSchema, type Form } from "../components/formInterpreter/types/type"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react"
import FormInterpreter from "../components/formInterpreter"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const isRendezVous = (data : any) => {
    if (!data) return false

    return (
        data["medical.first_name"] != null &&
        data["medical.last_name"] != null
    )
}

export default () => {

    const [form, setForm] = useState<null | Form>()
    const [taskID, setTaskId] = useState("")
    const [formData, setFormData] = useState<any>(null)

    console.log(formData);
    

    const { data, refetch } = useQuery({
        queryKey: ["onGoingTasks"],
        queryFn: async () => {
            const res = await fetch(BACKEND_URL + "/ongoing?inventory_id=test")
            if (!res.ok) throw new Error()
            const json = await res.json()
            return json
        }
    })



    return (
        <div className="flex flex-col">

            <Modal onClose={() => setForm(null)} className="bg-neutral-100" isOpen={form != null} >
                <ModalContent>
                    {(onClose) => (
                        <>{form != null && <>
                            <ModalHeader className="flex flex-col gap-1">Confirmation de rendez-vous</ModalHeader>
                            <ModalBody>
                                <FormInterpreter data={formData} setData={setFormData} form={form} isDisabled={false} />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={async () => {
                                    await fetch(BACKEND_URL + "/next?task_id=" + taskID, {
                                        method: "POST",
                                        headers: {
                                            "content-type": "application/json"
                                        },
                                        body: JSON.stringify(formData)
                                    })
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

            <Navbar />
            <div className="p-10 gap-4 flex flex-col">

                <p className="font-semibold semiexpanded pb-2">Liste des rendez-vous</p>

                {data && data.map((task: any, index: number) => {
                    if (!isRendezVous(task.data)) return null
                 
                    const { current_node_id } = task
                    return (
                        <div
                            onClick={async () => {
                                try {
                                    const res = await fetch(BACKEND_URL + "/status?task_id=" + task.id)
                                    if (!res.ok) throw new Error()
                                    const json = await res.json()
                                    const form = FormSchema.parse(json.form)
                                    setTaskId(task.id)
                                    setForm(form)
                                    
                                    
                                    if(json.data)setFormData(json.data)
                                    
                                } catch {

                                }
                            }}
                            key={index}
                            className={`
                                ${current_node_id == null ? "opacity-80" : "hover:scale-[1.01]  hover:shadow-md "}
                            w-full max-w-md
                            p-4 rounded-2xl
                            flex items-center justify-between
                            bg-gradient-to-br from-zinc-50 to-zinc-100
                            shadow-sm
                            transition-all
                           
                            cursor-pointer
                        `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                ${current_node_id == null ? "bg-success" : "bg-zinc-600"}
                                flex items-center justify-center
                                w-10 h-10
                                rounded-full
                                 text-white
                            `}>
                                    <FaCalendar size={16} />
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-zinc-900">
                                        {`${current_node_id == null ? "Rendez-vous confirmé" : "Rendez-vous en cours"}`}

                                    </span>
                                    <span className="text-xs text-zinc-700">

                                        {task.data["medical.first_name"]} · {task.data["medical.last_name"]}
                                    </span>
                                </div>
                            </div>
                            {current_node_id == null ? <></> : <RiArrowRightSLine />}
                            

                        </div>

                    )
                })}
            </div>
        </div>
    )
}