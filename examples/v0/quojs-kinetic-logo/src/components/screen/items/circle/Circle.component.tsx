import { useSliceProp } from "../../../../state/hooks";

import "./Circle.style.scss";

interface RectComponentProps {
    id: string;

    /**
     * These represent Declarative, Ultra-simple and eXpressive ;) */
    group: "d" | "u" | "x";
}

export const Circle = ({
    id,
    group,
}: RectComponentProps) => {
    const path = `${group}.${id}` as const; // capture exact literal
    const { x, y } = useSliceProp({
        reducer: 'logo',
        property: path,
    }) ?? { x: 0, y: 0 }; // have to wait for the first sim frame

    return (
        <circle
            className={`group-${group}`}
            cx={`${x}px`}
            cy={`${y}px`}
        />
    );
};
