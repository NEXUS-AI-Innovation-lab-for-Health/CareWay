import { useState, useEffect } from 'react';
import { wadouri, init } from '@cornerstonejs/dicom-image-loader';
import { metaData as cornerstoneMetaData, imageLoader } from '@cornerstonejs/core';
import { MetadataModules } from '@cornerstonejs/core/enums';
import type { SeriesMap } from './types';

export function useDicomSeries({ imageFiles, onLoaded }: { imageFiles: FileList | null; onLoaded: (seriesMap: SeriesMap) => void }) {
    const [seriesMap, setSeriesMap] = useState<SeriesMap>({});
    const [allImageIds, setAllImageIds] = useState<string[] | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            await init();
            setInitialized(true);
        })();
    }, []);

    useEffect(() => {
        if (!imageFiles || !initialized) return;

        const process = async () => {
            setLoading(true);
            const map: SeriesMap = {};
            const allIds: string[] = [];

            for (const file of Array.from(imageFiles)) {
                const imageId = wadouri.fileManager.add(file);
                allIds.push(imageId);

                try {
                    await imageLoader.loadAndCacheImage(imageId);
                } catch (e) {
                    console.warn("Failed to load image", imageId, e);
                    continue;
                }

                const GeneralSeriesMetadata = cornerstoneMetaData.get(
                    MetadataModules.GENERAL_SERIES,
                    imageId
                );
                const GeneralImageMetadata = cornerstoneMetaData.get(
                    MetadataModules.GENERAL_IMAGE,
                    imageId
                );

                const seriesUID: string | undefined = GeneralSeriesMetadata?.seriesInstanceUID;
                const instanceNumber: number | undefined = GeneralImageMetadata?.instanceNumber;

                if (!seriesUID) continue;

                if (!map[seriesUID]) map[seriesUID] = [];

                map[seriesUID].push({ imageId, instanceNumber });
            }

            // Tri par numéro d’instance
            for (const uid in map) {
                map[uid].sort(
                    (a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0)
                );
            }

            setSeriesMap(map);
            setAllImageIds(allIds);
            setLoading(false);
            if (onLoaded) onLoaded(map);
        };

        process();
    }, [imageFiles, initialized, onLoaded]);

    return { seriesMap, allImageIds, loading };
}

