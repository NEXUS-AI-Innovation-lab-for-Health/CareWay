import z from "zod";

export type SeriesInstance = {
  imageId: string;
  instanceNumber?: number;
};

export type SeriesMap = Record<string, SeriesInstance[]>;


export const ToolsKeysSchema = z.enum(['zoom', 'ruler' , 'level' , 'circle' , 'pan'])
export type ToolsKeys = z.infer<typeof ToolsKeysSchema>