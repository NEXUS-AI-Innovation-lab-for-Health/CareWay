import exampleData, { fakeCollectionsData } from "./exampleData"


export const useCollections = () => {
    return exampleData
}


export const useCollectionData = ({ collectionId }: { collectionId: string }) => {
    return fakeCollectionsData.find(e => e.collectionId == collectionId)
}

