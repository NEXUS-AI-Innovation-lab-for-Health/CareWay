import { useQuery } from "@tanstack/react-query"


export default ({ orthancUrl, isOpen }: { orthancUrl: string, isOpen: boolean }) => {

    const { } = useQuery({
        queryKey : ["Get Studies From Orthanc"],
        enabled: isOpen,
        queryFn: async () => {
            const res = await fetch(orthancUrl + "/studies?expand")
            const json = await res.json()
            
        }
    })


    return <div className="grid grid-cols-4">

    </div>
}