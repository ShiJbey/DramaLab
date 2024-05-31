import React, { useRef, useEffect } from "react";
import { Layer, Rect } from "react-konva";

const BackgroundGrid = ({ width, height, gridSize, gridColor }) => {
	const gridRef = useRef();

	useEffect(() => {
		const canvas = gridRef.current.getCanvas();
		const context = canvas.getContext("2d");

		const drawGrid = () => {
			context.clearRect(0, 0, width, height);
			context.beginPath();

			for (let x = 0; x < width; x += gridSize) {
				context.moveTo(x, 0);
				context.lineTo(x, height);
			}

			for (let y = 0; y < height; y += gridSize) {
				context.moveTo(0, y);
				context.lineTo(width, y);
			}

			context.strokeStyle = gridColor;
			context.stroke();
		};

		drawGrid();
	}, [width, height, gridSize, gridColor]);

	return (
		<Layer ref={gridRef}>
			<Rect width={width} height={height} />
		</Layer>
	);
};

export default BackgroundGrid;
