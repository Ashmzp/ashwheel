import React from 'react';

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  targetWidthCm = 3.5,
  targetHeightCm = 4.5,
  dpi = 300
) {
  if (!pixelCrop) {
    return null;
  }
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  // now we extract the cropped area
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set the final canvas to the target dimensions in pixels
  const targetWidthPx = Math.floor(targetWidthCm / 2.54 * dpi);
  const targetHeightPx = Math.floor(targetHeightCm / 2.54 * dpi);
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  
  // To get a high-quality result, we create a temporary canvas
  // to draw the cropped image data, and then draw that onto our final canvas.
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = pixelCrop.width;
  tempCanvas.height = pixelCrop.height;
  tempCtx.putImageData(data, 0, 0);

  // draw the cropped image from the temp canvas to the final canvas, resizing it
  ctx.drawImage(tempCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, targetWidthPx, targetHeightPx);

  return new Promise((resolve) => {
     resolve(canvas.toDataURL('image/jpeg', 1.0));
  });
}