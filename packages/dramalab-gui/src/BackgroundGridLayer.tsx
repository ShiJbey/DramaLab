import React, { useRef, useEffect } from "react";
import { Layer, Line } from "react-konva";

const BackgroundGridLayer: React.FC<{
	gridSize?: number;
	gridColor?: string;
	zoomScale?: number;
}> = ({ gridSize = 20, gridColor = "#000", zoomScale = 1 }) => {
	const layerRef = useRef(null);
	const gridLines: React.ReactNode[] = [];

	useEffect(() => {
		populateGridLines();
	}, [zoomScale]);

	const populateGridLines = () => {
		const stageWidth = layerRef.current.getStage().width();
		const stageHeight = layerRef.current.getStage().height();

		for (let x = 0; x <= stageWidth; x += gridSize * zoomScale) {
			gridLines.push(
				<Line
					key={`vertical_${x}`}
					points={[x, 0, x, stageHeight]}
					stroke={gridColor}
					strokeWidth={5}
				/>
			);
		}

		for (let y = 0; y <= stageHeight; y += gridSize * zoomScale) {
			gridLines.push(
				<Line
					key={`horizontal_${y}`}
					points={[0, y, stageWidth, y]}
					stroke={gridColor}
					strokeWidth={5}
				/>
			);
		}

		console.log(gridLines);
	};

	return <Layer ref={layerRef}>{gridLines.map((l) => l)}</Layer>;
};

export default BackgroundGridLayer;
