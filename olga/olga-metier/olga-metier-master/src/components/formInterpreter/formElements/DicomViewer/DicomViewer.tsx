import { useEffect, useState } from "react";
import {
  init as coreInit,
  Enums,
  RenderingEngine,
  StackViewport,
} from '@cornerstonejs/core';
import { Spinner } from "@heroui/react";
import { init as cornerstoneToolsInit } from '@cornerstonejs/tools';
import { createToolGroup, applyEnabledTools } from './DicomToolManager.js';
import type { ToolsKeys } from "./types.js";
import type { IToolGroup } from "@cornerstonejs/tools/types";

const viewportId = 'CT_AXIAL_STACK';

export default function DicomViewer({ imageIds, imageIndex = 0, enabledTools = [], elementRef }:
  { imageIds: Array<string>, imageIndex: number, enabledTools: Array<ToolsKeys>, elementRef: React.RefObject<HTMLDivElement | null> }) {

  const [renderingEngine, setRenderingEngine] = useState<RenderingEngine | null>(null);
  const [toolGroup, setToolGroup] = useState<IToolGroup | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (renderingEngine || !elementRef.current) return;

    const init = async () => {
      await coreInit();
      await cornerstoneToolsInit();
      if (!elementRef.current) {
        return;
      }
      const _renderingEngine = new RenderingEngine('myRenderingEngine');
      _renderingEngine.enableElement({
        viewportId,
        type: Enums.ViewportType.STACK,
        element: elementRef.current,
      });
      setRenderingEngine(_renderingEngine);
    };

    init();
  }, [renderingEngine]);

  useEffect(() => {
    if (renderingEngine && !toolGroup && !initialized) {
      const _toolGroup = createToolGroup(viewportId);

      
      setToolGroup(_toolGroup);
      setInitialized(true);
    }
  }, [renderingEngine, toolGroup]);

  useEffect(() => {
    if (toolGroup && enabledTools) {
      applyEnabledTools(toolGroup, enabledTools);
    }
  }, [toolGroup, enabledTools]);

  useEffect(() => {
    if (!initialized || !imageIds || !renderingEngine) return;
    const viewport = renderingEngine.getStackViewport(viewportId);
    viewport.setStack(imageIds, imageIndex);
    viewport.render();
  }, [imageIndex, imageIds, initialized]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      ref={elementRef}
      style={{
        width: "512px",
        height: "512px",
        position: "relative",
        backgroundColor: "black",
      }}
    >
      {!initialized && (
        <Spinner
          className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-60 z-50"
          size="sm"
          variant="spinner"
          color="white"
        />
      )}
    </div>
  );
}
