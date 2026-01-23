import { useRef } from "react";

import { Circle } from "./items/circle/Circle.component";

import { useEmit, useAtomicProp } from "../../state/hooks";
import { eventToSvgUserCoords } from "../../utils";

import "./Screen.style.scss";

interface ScreenComponentProps { }

export const Screen = ({ }: ScreenComponentProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const emit = useEmit();

    // atomic subscriptions to specific props
    const { height, width } = useAtomicProp({
        reducer: 'logo',
        property: "size",
    });
    const isEnabled = useAtomicProp({
        reducer: 'logo',
        property: "enabled",
    });
    const itemCount = useAtomicProp({
        reducer: 'logo',
        property: "itemCount",
    });

    const viewBox = `0 0 ${width} ${height}`;
    const svgItems = [];

    for (let index = 0; index < itemCount.d; index++) {
        svgItems.push(
            <Circle
                key={`circle_d_${index}`}
                group="d"
                id={`circle_d_${index}`}
            />
        );
    }

    for (let index = 0; index < itemCount.u; index++) {
        svgItems.push(
            <Circle
                key={`circle_u_${index}`}
                group="u"
                id={`circle_u_${index}`}
            />
        );
    }

    for (let index = 0; index < itemCount.x; index++) {
        svgItems.push(
            <Circle
                key={`circle_x_${index}`}
                group="x"
                id={`circle_x_${index}`}
            />
        );
    }

    const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!isEnabled) return;

        const svg = svgRef.current!;
        const eventCoords = eventToSvgUserCoords(event, svg);

        emit("on", "mousemove", eventCoords);
    };

    return (
        <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            className={"screen"}
            viewBox={viewBox}
            preserveAspectRatio=""
            onPointerMove={handlePointer}
        >
            {svgItems}
        </svg>
    );
};
