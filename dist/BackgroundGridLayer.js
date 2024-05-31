"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_konva_1 = require("react-konva");
const BackgroundGridLayer = ({ gridSize = 20, gridColor = "#000", zoomScale = 1 }) => {
    const layerRef = (0, react_1.useRef)(null);
    const gridLines = [];
    (0, react_1.useEffect)(() => {
        populateGridLines();
    }, [zoomScale]);
    const populateGridLines = () => {
        const stageWidth = layerRef.current.getStage().width();
        const stageHeight = layerRef.current.getStage().height();
        for (let x = 0; x <= stageWidth; x += gridSize * zoomScale) {
            gridLines.push((0, jsx_runtime_1.jsx)(react_konva_1.Line, { points: [x, 0, x, stageHeight], stroke: gridColor, strokeWidth: 5 }, `vertical_${x}`));
        }
        for (let y = 0; y <= stageHeight; y += gridSize * zoomScale) {
            gridLines.push((0, jsx_runtime_1.jsx)(react_konva_1.Line, { points: [0, y, stageWidth, y], stroke: gridColor, strokeWidth: 5 }, `horizontal_${y}`));
        }
        console.log(gridLines);
    };
    return (0, jsx_runtime_1.jsx)(react_konva_1.Layer, Object.assign({ ref: layerRef }, { children: gridLines.map((l) => l) }), void 0);
};
exports.default = BackgroundGridLayer;
//# sourceMappingURL=BackgroundGridLayer.js.map