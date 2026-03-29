import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react"
import { useQuery } from "@tanstack/react-query"
import { CiCircleCheck } from "react-icons/ci";
import { useMemo, useState } from "react"
import z from "zod"
import { FormSchema, type Form } from "../components/formInterpreter/types/type"
import FormInterpreter from "../components/formInterpreter"
import Navbar from "../components/Navbar"
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const API_URL = import.meta.env.VITE_BACKEND_URL

const inventorySchema = z.object({
    code: z.string(),
    description: z.string(),
    canStart: z.boolean().optional() // ← Ajout ici
})


export default () => {


    const [form, setForm] = useState<Form | null>(null)
    const [taskId, setTaskId] = useState("")
    const [formData, setFormData] = useState<any>({})
    const [nextGroups, setNextGroups] = useState<null | Array<string>>(null)
    const [isTaskDone, setIsTaskDone] = useState<boolean>(false)

    const email = useMemo(() => {
        return localStorage.getItem("login")
    }, [])

    const { data, isLoading: isInventoriesLoading } = useQuery({
        queryKey: ["getAllInventories"],
        queryFn: async () => {
            const res = await fetch(API_URL + "/getAllInventoriesForUser?email=" + email)
            if (!res.ok) throw new Error()
            return z.array(inventorySchema).parse(await res.json())
        }
    })

    const { data: startedTasks, isLoading: isStartedTasksLoading, refetch : refetchStartedTasks } = useQuery({
        queryKey: ["getStartedTasks", email],
        queryFn: async () => {
            const res = await fetch(API_URL + "/getStartedTasks?email=" + email)
            if (!res.ok) throw new Error()
            return z.array(z.record(z.string(), z.any())).parse(await res.json())
        }
    })



    const { data: onGoingTasks, isLoading: isOnGoingTasksLoading, refetch } = useQuery({
        queryKey: ["getOnGoingTasks", email],
        queryFn: async () => {
            const res = await fetch(API_URL + "/ongoingUser?email=" + email)
            if (!res.ok) throw new Error()
            return z.array(z.record(z.string(), z.any())).parse(await res.json())
        }
    })

    const fiteredStartedTasks = useMemo(() => {
        if (startedTasks && !isStartedTasksLoading && onGoingTasks && !isOnGoingTasksLoading) {            
            return startedTasks.filter(e => onGoingTasks && !onGoingTasks.find(e2 => e2.id == e.id))
        } else return null
    }, [onGoingTasks, startedTasks])


    return <div className="flex h-screen w-screen bg-neutral-100 flex-col">
        <Navbar />
        <div className="p-4 flex flex-col">

            <h1 className="text-2xl font-semibold semiexpanded">Tasks</h1>
            <h2 className="text-xl font-light semiexpanded">{email}</h2>
            <div className="flex mt-10 gap-10">
                <div className="flex flex-col w-100 gap-3">
                    <p className="text-xs opacity-80">Launchable tasks</p>
                    {!isInventoriesLoading && data && data.map(inventory => (
                        <div className="text-xs p-3 bg-white rounded-3xl w-full flex flex-col" key={inventory.code}>
                            <p>{inventory.code}</p>
                            <p className="opacity-50">{inventory.description}</p>
                            {inventory.canStart && (
                                <Button onPress={async () => {
                                    const res = await fetch(API_URL + "/startTask?inventory_id=" + inventory.code + "&email=" + email)
                                    try {
                                        if (!res.ok) throw new Error()
                                        const json = await res.json()
                                        const form = FormSchema.parse(json.form)
                                        setForm(form)
                                        setTaskId(json.task_id)
                                    } catch {}
                                }} color="primary" size="sm" radius="full" className="ms-auto">Start</Button>
                            )}
                        </div>
                    ))}
                    {!isInventoriesLoading && data && data.length == 0 && <p className="text-xs p-15 bg-white rounded-3xl text-warning text-center">Aucune tache à lancer</p>}
                </div>

                <div className="flex flex-col w-100 gap-3">
                    <p className="text-xs opacity-80">Takable tasks</p>

                    {!isOnGoingTasksLoading && onGoingTasks && onGoingTasks.map(e => (
                        <div className="text-xs p-3 bg-white rounded-3xl w-full flex  items-center gap-2">
                            <p>{e.inventory_code}</p>
                            <p className="opacity-50">{e.current_node_id}</p>
                            <Button onPress={async () => {
                                const res = await fetch(API_URL + "/status?task_id=" + e.id)
                                try {
                                    if (!res.ok) throw new Error()
                                    const json = await res.json()
                                    const form = FormSchema.parse(json.form)
                                    setForm(form)
                                    setFormData(json.data)
                                    setTaskId(e.id)
                                } catch {}

                            }} color="primary" size="sm" radius="full" className="ms-auto">Poursuivre</Button>
                        </div>
                    ))}

                    {!isOnGoingTasksLoading && onGoingTasks && onGoingTasks.length == 0 && <p className="text-xs p-15 bg-white rounded-3xl text-warning text-center">Aucune tache à prendre</p>}
                </div>

                <div className="flex flex-col w-100 gap-3">
                    <p className="text-xs opacity-80">Tasks that you have started</p>

                    {fiteredStartedTasks && fiteredStartedTasks.map(e => (
                        <div className="text-xs p-3 bg-white rounded-3xl w-full flex  items-center gap-2">
                            <p>{e.inventory_code}</p>
                            <p className="opacity-50">{e.current_node_id}</p>
                            <MdOutlineKeyboardArrowRight className="ms-auto" />
                        </div>
                    ))}

                    {fiteredStartedTasks && fiteredStartedTasks.length == 0 && <p className="text-xs p-15 bg-white rounded-3xl text-warning text-center">Aucune tache à prendre</p>}
                </div>
            </div>

            <Modal className="bg-neutral-100" onClose={() => setForm(null)} isOpen={form != null || isTaskDone}>
                <ModalContent>
                    <ModalHeader>Task executor</ModalHeader>
                    <ModalBody>
                        {isTaskDone && <div className="flex flex-col items-center">
                            <p className="semiexpanded font-semibold font-2xl mb-1">Tache validée</p>
                            <CiCircleCheck className="!text-success" size={40} />
                            {nextGroups && (
                                <p className="text-sm  mt-10">
                                    Ces groupes vont prendre le relais : <span className="font-semibold">{nextGroups.join(", ")}</span>
                                </p>
                            )}
                        </div>}
                        {form != null && <FormInterpreter data={formData} setData={setFormData} form={form} isDisabled={false} />}
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={async () => {
                            if (isTaskDone) {
                                setIsTaskDone(false)
                                setNextGroups(null)
                                return
                            }
                            try {
                                const res = await fetch(API_URL + "/next?task_id=" + taskId + "&email=" + email, {
                                    method: "POST",
                                    headers: {
                                        "content-type": "application/json"
                                    },
                                    body: JSON.stringify(formData)
                                })
                                const json = await res.json()
                                if (json.form) {
                                    setForm(FormSchema.parse(json.form))
                                } else {
                                    setForm(null)
                                    setIsTaskDone(true)
                                    if (json.next_groups && Array.isArray(json.next_groups)) setNextGroups(json.next_groups)
                                }
                                refetch()
                                refetchStartedTasks()
                            } catch {

                            }



                        }} color="primary">{isTaskDone ? "OK" : "Next"}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </div>

    </div>
}