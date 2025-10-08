import React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

const DraggableImage = ({ src, onDragEnd, x, y, width, height }) => {
    const [image] = useImage(src, 'anonymous');
    return (
        <KonvaImage
            image={image}
            draggable
            onDragEnd={onDragEnd}
            x={x || 0}
            y={y || 0}
            width={width}
            height={height}
        />
    );
};

export default DraggableImage;