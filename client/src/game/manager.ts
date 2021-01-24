import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { ServerShape } from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { g2l } from "@/game/units";
import { sendClientLocationOptions } from "./api/emits/client";
import { getFloorId } from "./layers/store";
import { Shape } from "./shapes/shape";

export class GameManager {
    async addShape(shape: ServerShape, sync: SyncMode): Promise<Shape | undefined> {
        if (!layerManager.hasLayer(layerManager.getFloor(getFloorId(shape.floor))!, shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = layerManager.getLayer(layerManager.getFloor(getFloorId(shape.floor))!, shape.layer)!;
        const sh = await createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type_} could not be added`);
            return;
        }
        layer.addShape(sh, sync, InvalidationMode.NORMAL);
        layer.invalidate(false);
        return sh;
    }

    setCenterPosition(position: GlobalPoint): void {
        const localPos = g2l(position);
        gameStore.increasePanX((window.innerWidth / 2 - localPos.x) / gameStore.zoomFactor);
        gameStore.increasePanY((window.innerHeight / 2 - localPos.y) / gameStore.zoomFactor);
        layerManager.invalidateAllFloors();
        sendClientLocationOptions();
    }
}

export const gameManager = new GameManager();
(window as any).gameManager = gameManager;
