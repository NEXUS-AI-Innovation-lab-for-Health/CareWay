import type { DataModel } from "./types";


export const dataModelsExampleData = [
    {
        "label": "Entity",
        id: "entity",
        "fields": [
            { "label": "id", "type": "string", key: 'id' },
            { "label": "createdAt", "type": "string", key: 'createdAt' }
        ]
    },
    {
        label: "Patient",
        id: "patient",
        fields: [
            { label: "Patient ID", key: "patientId", type: "string" },
            { label: "Full label", key: "fulllabel", type: "string" },
            { label: "Date of Birth", key: "dateOfBirth", type: "string" },
            { label: "Phone Number", key: "phoneNumber", type: "string" }
        ]
    },
     {
        label: "Adresse",
        id: "adresse",
        fields: [
            { label: "Adresse", key: "adresse", type: "string" },
            { label: "Ville", key: "ville", type: "string" },
            { label: "Code Postal", key: "codePostal", type: "string" },
        ],
    },

] satisfies DataModel[]