import {
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
  LengthTool,
  CircleROITool,
  addTool,
  Enums as csToolsEnums,
  PanTool,
} from '@cornerstonejs/tools';
import type { ToolsKeys } from './types';


export const TOOL_GROUP_ID = 'myToolGroup';

export const ToolsBindings = {
  zoom: csToolsEnums.MouseBindings.Secondary,
  ruler: csToolsEnums.MouseBindings.Primary,
  level: csToolsEnums.MouseBindings.Primary,
  circle: csToolsEnums.MouseBindings.Primary,
  pan: csToolsEnums.MouseBindings.Primary
} as const satisfies Record<ToolsKeys, number>;


const Tools = {
  level: WindowLevelTool,
  zoom: ZoomTool,
  ruler: LengthTool,
  circle: CircleROITool,
  pan: PanTool
} as const satisfies Record<ToolsKeys, any>;

export function createToolGroup(viewportId: string) {

  addTool(ZoomTool);
  addTool(WindowLevelTool);
  addTool(LengthTool);
  addTool(CircleROITool);
  addTool(PanTool)

  let toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID)
  if (!toolGroup) toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID);
  if (toolGroup) {
    toolGroup.addTool(ZoomTool.toolName);
    toolGroup.addTool(WindowLevelTool.toolName);
    toolGroup.addTool(LengthTool.toolName);
    toolGroup.addTool(CircleROITool.toolName);
    toolGroup.addTool(PanTool.toolName)

    toolGroup.addViewport(viewportId);
    return toolGroup;

  }

  return null


}

export function applyEnabledTools(toolGroup: any, enabledTools: Array<string>) {

  if (!toolGroup) return;

  (Object.keys(Tools) as ToolsKeys[]).forEach((key) => {
    const Tool = Tools[key];
    if (enabledTools.includes(key)) {
      toolGroup.setToolActive(Tool.toolName, {
        bindings: [{ mouseButton: ToolsBindings[key] }],
      });
    } else {
      toolGroup.setToolDisabled(Tool.toolName);
    }
  });
}
