import { RiGalleryView2 } from "react-icons/ri"
import type { SeriesMap } from "./types"

export default ({ seriesMap, selectedSerie, onChange } : {seriesMap : SeriesMap, selectedSerie : string | null, onChange : (key : string)=>void}) => {
    return (<div className="flex gap-2 flex-col w-full">
        <div className="flex items-center h-fit ps-2 gap-1.5">
            <RiGalleryView2 size={16} className="dark:text-zinc-300 text-zinc-700" /> <p className="dark:text-zinc-300 text-black font-light text-xs tracking-widest">Gallery</p>
        </div>
        <div className="grid gap-4 grid-cols-2">
            {Object.keys(seriesMap).map((key, i) =>
                <div key={i} onClick={() => onChange(key)}
                    className={`w-full ${selectedSerie == key ? '!border-primary' : ''} border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer 
             rounded-3xl h-24 bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center`}>
                    <p className="dark:text-zinc-400 text-black text-[10px] font-light tracking-widest">Serie {i + 1}</p>
                </div>)}
        </div>
    </div>
    )
}