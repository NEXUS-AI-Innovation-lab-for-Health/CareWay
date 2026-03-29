import type { Collection } from "./types";
import { dataModelsExampleData } from "../dataModels/exampleData";

export default [
    {
        label: "Patients",
        id: 'patients',
        models: [dataModelsExampleData[0].key]
    },
    {
        label: "Humans",
        id: 'humans',
        models: [dataModelsExampleData[0].key, dataModelsExampleData[1].key]
    }
] satisfies Array<Collection>


export const fakeCollectionsData = [{
    collectionId: "patients",
    models: [dataModelsExampleData[0].key],
    data: [{
        createdAt: "20/09/2003",
        id: "1"
    },
    {
        createdAt: "14/04/2014",
        id: "2"
    }
    ]
}]