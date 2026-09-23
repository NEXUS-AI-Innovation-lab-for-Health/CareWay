import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import DicomViewer from "./DicomViewer";
import { Button, Image, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, Spinner } from "@heroui/react";
import { MdOutlineFileUpload } from "react-icons/md";
import { Slider } from "@heroui/slider";
import ToolsBar from "./ToolsBar";
import { useDicomSeries } from "./hooks"
import Gallery from "./Gallery";
import { FaCircleInfo } from "react-icons/fa6";
import html2canvas from "html2canvas";
import { FaImages } from "react-icons/fa6";
import type { SeriesMap, ToolsKeys } from "./types";
import { FaCloudDownloadAlt } from "react-icons/fa";
import OrthancStudiesList from "./OrthancStudiesList";

export default function ({ onSaveImage, enabled, images, setRender, orthancUrl, isDisabled }:
  { onSaveImage: (image: string) => void, enabled: boolean, images: Array<string>, setRender?: Dispatch<SetStateAction<ReactNode>>, orthancUrl: string, className?: string, isDisabled: boolean }) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [dicomFiles, setDicomFiles] = useState<FileList | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTools, setSelectedTools] = useState<Array<ToolsKeys>>(['level'])
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [isOrthanc, setIsOrthanc] = useState<boolean>(false)


  const handleSeriesLoaded = useCallback((seriesMap: SeriesMap) => {
    setSelectedSerie(Object.keys(seriesMap)[0]);
  }, []);

  const { loading, allImageIds, seriesMap } = useDicomSeries({
    imageFiles: dicomFiles, onLoaded: handleSeriesLoaded
  })
  const fileUpload = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setDicomFiles(files);
  };

  const imagesIdsToShow = useMemo(() => {
    if (!seriesMap || !selectedSerie) return null
    return seriesMap[selectedSerie].map(e => e.imageId)
  }, [selectedSerie, seriesMap])

  const render = useMemo(() => {
    if (isOpen) {
      return <div className={`flex gap-1 items-center h-[670px] w-full`}>

        <Modal backdrop="blur" isOpen={isOrthanc} onClose={()=>setIsOrthanc(false)}>
          <ModalContent>
            <ModalHeader>Choose study from Orthanc</ModalHeader>
            <ModalBody>
              <OrthancStudiesList orthancUrl={orthancUrl} isOpen={isOrthanc} />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={()=>setIsOrthanc(false)}>
                  Close
                </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>


        {(!dicomFiles || loading) &&
          <div className=" w-full  rounded-3xl bg-white dark:bg-black justify-center h-full flex items-center gap-2 flex-col">
            {!dicomFiles && <><input className="hidden"
              // @ts-expect-error   
              webkitdirectory="true"
              ref={fileUpload} type="file" onChange={handleFileChange} multiple accept=".dcm" />
              <div className="flex bg-neutral-50 p-4 pb-3 rounded-2xl items-center gap-2  flex-col">
                <p className="text-zinc-500  text-xs w-fit tracking-widest">Upload DICOM Files</p>
                <Button onPress={() => { if (fileUpload.current) fileUpload.current.click() }} size="sm"
                  color="primary" isIconOnly variant="flat" className="tracking-widest"><MdOutlineFileUpload size={17} /></Button>
              </div>

              <p className="text-xs text-neutral-500">Or</p>

              <div className="flex bg-neutral-50 p-4 pb-3 rounded-2xl items-center gap-2  flex-col">
                <p className="text-zinc-500  text-xs w-fit tracking-widest">Load from orthanc</p>
                <Button onPress={() => { setIsOrthanc(true)}} size="sm"
                  color="primary" isIconOnly variant="flat" className="tracking-widest"><FaCloudDownloadAlt size={17} /></Button>
              </div>

            </>}
            {loading && <>
              <Spinner
                className="opacity-60 z-50"
                size="sm"
                variant="simple"
                color="current"
              />
              <p className="text-zinc-300 font-light text-xs tracking-widest">Chargement des images</p></>}
          </div>}

        {dicomFiles && !loading && <>
          <div className="min-w-64 h-full  bg-white dark:bg-black p-4 rounded-e-none z-50 rounded-3xl ">
            <Gallery selectedSerie={selectedSerie} onChange={setSelectedSerie} seriesMap={seriesMap} />
          </div>
          <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-black border-zinc-900 p-4">
            {imagesIdsToShow && <div className="w-2/3 mx-auto rounded-2xl">
              <ToolsBar onSaveImage={() => {
                if (viewerRef.current) {
                  html2canvas(viewerRef.current, {
                    useCORS: true,
                  }).then(canvas => {
                    const dataURL = canvas.toDataURL('image/png');
                    // const link = document.createElement('a');
                    // link.href = dataURL;
                    // link.download = 'capture.png';
                    // link.click();
                    if (onSaveImage) onSaveImage(dataURL)
                  });
                }
              }} onChange={setSelectedTools} selectedTools={selectedTools} />
            </div>}

            <div className="p-2 bg-white dark:bg-black   rounded-3xl flex justify-center  items-center">

              {imagesIdsToShow && <DicomViewer elementRef={viewerRef} imageIds={imagesIdsToShow} enabledTools={selectedTools} imageIndex={currentImageIndex} />}
            </div>

            {imagesIdsToShow && <div className="w-full mt-2 px-3  rounded-3xl ">
              <div className="flex justify-between items-center">
                <p className="text-zinc-400 text-[10px] tracking-widest  w-fit rounded-lg text-end "> Image index</p>
                <p className="text-zinc-400 text-[9px] tracking-wider bg-zinc-900 w-fit  rounded-lg px-2 py-0.5 text-end "> {currentImageIndex + 1} / {imagesIdsToShow.length}</p>
              </div>
              <div className="mt-1">
                <Slider aria-label="Dicom image index"
                  value={currentImageIndex}
                  classNames={{ filler: 'hidden', thumb: 'px-4 bg-zinc-500 h-3' }}
                  size="md"

                  maxValue={imagesIdsToShow.length - 1}
                  // onChange={setCurrentImageIndex}
                  minValue={0}
                  step={1}
                >
                </Slider>
              </div>
            </div>}
          </div>

          <div className="min-w-64 p-4 flex  flex-col h-full  rounded-e-3xl bg-white dark:bg-black">
            <div className="flex items-center h-fit ps-2 pb-2 gap-1.5">
              <FaImages size={16} className="dark:text-zinc-300" /> <p className="dark:text-zinc-300 font-light text-xs tracking-widest">Saved images</p>
            </div>
            <div className="h-full w-full py-2 pe-2 overflow-auto">
              <div className="flex flex-col gap-2 w-full">
                {(images && Array.isArray(images)) ? <>
                  {images.map(e => <Image src={e} classNames={{ wrapper: 'min-w-full' }} className="w-full border-2 border-zinc-800 h-44 object-contain" />)}
                </> : <p className="text-warning ps-2 text-xs  tracking-wider "> No Image Registered Yet </p>}
              </div>
            </div>
          </div>
        </>}
      </div>
    }
    return null
  }, [images, isOpen, imagesIdsToShow, dicomFiles, selectedTools, currentImageIndex, loading, isOrthanc])

  useEffect(() => {
    if (setRender) {
      setRender(() => render)
    }
  }, [render, setRender])

  return (
    <div className={`${isDisabled ? "opacity-70" : ""} flex flex-col w-full`}>
      <div className="flex bg-white shadow-sm dark:bg-zinc-900 rounded-2xl ps-3  p-1 items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex h-full  items-center">
            <p className="text-primary font-bold  tracking-widest text-xs text-center">Dicom Element</p>
            <Popover color="primary" placement="right">
              <PopoverTrigger>
                <Button isIconOnly size="sm" radius="full" className="!p-0 !size-fit bg-transparent" >
                  <FaCircleInfo className="text-primary cursor-pointer hover:text-blue-400 transition-all" size={15} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2">
                  <div className="text-small font-bold">Dicom Element</div>
                  <div className="text-tiny">Click on the OPEN button to open the dicom editor! Except if you are in preview mode</div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-[11px] font-light">Orthanc url : {orthancUrl ? <span>{orthancUrl}</span> : <span className="text-danger">Not defined</span>} </p>
        </div>

        {isOpen ? <Button isDisabled={!enabled} onPress={() => setIsOpen(false)} className="tracking-widest text-xs" size="sm" color="warning" radius="lg">Close</Button> :
          <Button isDisabled={!enabled} onPress={() => setIsOpen(true)} className="tracking-widest text-xs" size="sm" color="primary" radius="lg">Open</Button>}
      </div>

      {setRender ? null : render}
    </div>
  );
}


