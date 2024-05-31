"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_konva_1 = require("react-konva");
const BackgroundGrid = ({ width, height, gridSize, gridColor }) => {
    const gridRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
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
    return ((0, jsx_runtime_1.jsx)(react_konva_1.Layer, Object.assign({ ref: gridRef }, { children: (0, jsx_runtime_1.jsx)(react_konva_1.Rect, { width: width, height: height }, void 0) }), void 0));
};
exports.default = BackgroundGrid;
//# sourceMappingURL=BackgroundGrid.js.map