import type { ApiFloor } from "../src/apiTypes";
import { toGP } from "../src/core/geometry";
import { addServerFloor } from "../src/game/core/floor/server";
import type { LocalId } from "../src/game/core/id";
import { generateLocalId } from "../src/game/core/id";
import type { IShape } from "../src/game/core/interfaces/shape";
import { LayerName } from "../src/game/core/models/floor";
import { Role } from "../src/game/core/models/role";
import { Rect } from "../src/game/core/shapes/variants/rect";
import { floorSystem } from "../src/game/core/systems/floors";
import type { Player, PlayerId } from "../src/game/core/systems/players/models";

export function generateTestShape(options?: { floor?: string }): IShape {
    const rect = new Rect(toGP(0, 0), 0, 0);
    if (options?.floor !== undefined) {
        let floor = floorSystem.getFloor({ name: options.floor });
        if (floor === undefined) {
            addServerFloor(generateTestFloor(options.floor));
            floor = floorSystem.getFloor({ name: options.floor })!;
        }
        rect.setLayer(floor.id, LayerName.Tokens);
    }
    rect.invalidate = () => {};
    return rect;
}

export function generateTestLocalId(shape?: IShape): LocalId {
    shape ??= generateTestShape();
    if (shape.id !== undefined) return shape.id;
    const id = generateLocalId(shape);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (shape as any).id = id;
    return id;
}

export function generatePlayer(name: string): Player {
    return {
        id: (100 * Math.random()) as PlayerId,
        name,
        location: 1,
        role: Role.Player,
        showRect: false,
    };
}

function generateTestFloor(name?: string): ApiFloor {
    return {
        name: name ?? "test floor",
        player_visible: false,
        type_: 1,
        background_color: null,
        layers: [
            {
                groups: [],
                index: 0,
                name: "test" as LayerName,
                player_editable: false,
                selectable: true,
                shapes: [],
                type_: "tokens",
            },
        ],
        index: 0,
    };
}
