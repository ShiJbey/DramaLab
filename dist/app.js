"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const client_1 = require("react-dom/client");
const react_1 = __importStar(require("react"));
const react_konva_1 = require("react-konva");
const fa_1 = require("react-icons/fa");
const ButtonGroup_1 = __importDefault(require("@mui/joy/ButtonGroup"));
const IconButton_1 = __importDefault(require("@mui/joy/IconButton"));
const Divider_1 = __importDefault(require("@mui/joy/Divider"));
const Box_1 = __importDefault(require("@mui/joy/Box"));
const joy_1 = require("@mui/joy");
const EventNotification_1 = __importDefault(require("./EventNotification"));
const BackgroundGridLayer_1 = __importDefault(require("./BackgroundGridLayer"));
function generateShapes() {
    return [...Array(10)].map((_, i) => ({
        id: i.toString(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        rotation: Math.random() * 180,
        isDragging: false,
    }));
}
const INITIAL_STATE = generateShapes();
const App = () => {
    const [stars, setStars] = react_1.default.useState([]);
    const [diagramInfoModelOpen, setDiagramInfoModelOpen] = react_1.default.useState(false);
    const [sidePanelOpen, setSidePanelOpen] = react_1.default.useState(false);
    const stage = (0, react_1.useRef)(null);
    const handleDragStart = (e) => {
        const id = e.target.id();
        setStars(stars.map((star) => {
            return Object.assign(Object.assign({}, star), { isDragging: star.id === id });
        }));
    };
    const handleDragEnd = (e) => {
        setStars(stars.map((star) => {
            return Object.assign(Object.assign({}, star), { isDragging: false });
        }));
    };
    const handleCharacterClicked = (e) => {
        console.log("Clicked: " + e.target.id().toString());
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_konva_1.Stage, Object.assign({ ref: stage, width: window.innerWidth, height: window.innerHeight, draggable: true, onDblClick: (e) => {
                    setStars([
                        ...stars,
                        {
                            id: stars.length.toString(),
                            x: stage.current.getPointerPosition().x,
                            y: stage.current.getPointerPosition().y,
                            rotation: Math.random() * 180,
                            isDragging: false,
                        },
                    ]);
                } }, { children: [(0, jsx_runtime_1.jsx)(react_konva_1.Layer, { children: stars.map((star) => ((0, jsx_runtime_1.jsx)(react_konva_1.Star, { id: star.id, x: star.x, y: star.y, numPoints: 5, innerRadius: 20, outerRadius: 40, fill: "#89b717", opacity: 1.0, draggable: true, rotation: star.rotation, shadowColor: "black", shadowBlur: 10, shadowOpacity: 0.6, shadowOffsetX: star.isDragging ? 10 : 5, shadowOffsetY: star.isDragging ? 10 : 5, scaleX: star.isDragging ? 1.2 : 1, scaleY: star.isDragging ? 1.2 : 1, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onClick: handleCharacterClicked }, star.id))) }, void 0), (0, jsx_runtime_1.jsx)(BackgroundGridLayer_1.default, { gridSize: 100 }, void 0)] }), void 0), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "name-bar" }, { children: (0, jsx_runtime_1.jsxs)(Box_1.default, Object.assign({ sx: {
                        display: "flex",
                        alignItems: "center",
                        width: "fit-content",
                        border: "1px solid",
                        padding: "8px",
                        borderColor: "divider",
                        borderRadius: "sm",
                        bgcolor: "background.surface",
                        color: "text.secondary",
                        "& svg": {
                            m: 1.5,
                        },
                        "& hr": {
                            mx: 0.5,
                        },
                    } }, { children: [(0, jsx_runtime_1.jsx)("h2", { children: "DramaLab" }, void 0), (0, jsx_runtime_1.jsx)(Divider_1.default, { orientation: "vertical", inset: "none" }, void 0), (0, jsx_runtime_1.jsx)(joy_1.Button, Object.assign({ variant: "plain", onClick: () => setDiagramInfoModelOpen(true) }, { children: "Diagram Name" }), void 0)] }), void 0) }), void 0), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "toolbar" }, { children: (0, jsx_runtime_1.jsxs)(ButtonGroup_1.default, Object.assign({ variant: "solid", orientation: "vertical", size: "sm", "aria-label": "outlined primary button group" }, { children: [(0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaMousePointer, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaVectorSquare, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaUserPlus, { onClick: () => setSidePanelOpen(true) }, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaHeart, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaEraser, {}, void 0) }, void 0)] }), void 0) }), void 0), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "sim-controls-bar" }, { children: (0, jsx_runtime_1.jsxs)(ButtonGroup_1.default, Object.assign({ variant: "solid", size: "sm", "aria-label": "outlined primary button group" }, { children: [(0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaStepForward, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaPlay, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaStop, {}, void 0) }, void 0)] }), void 0) }), void 0), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "notification-panel" }, { children: [(0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(EventNotification_1.default, {}, void 0)] }), void 0), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "zoom-toolbar" }, { children: (0, jsx_runtime_1.jsxs)(ButtonGroup_1.default, Object.assign({ variant: "solid", size: "sm", "aria-label": "outlined primary button group" }, { children: [(0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaPlus, {}, void 0) }, void 0), (0, jsx_runtime_1.jsx)(IconButton_1.default, { children: (0, jsx_runtime_1.jsx)(fa_1.FaMinus, {}, void 0) }, void 0)] }), void 0) }), void 0), (0, jsx_runtime_1.jsx)(joy_1.Modal, Object.assign({ open: diagramInfoModelOpen, onClose: () => setDiagramInfoModelOpen(false) }, { children: (0, jsx_runtime_1.jsxs)(joy_1.ModalDialog, { children: [(0, jsx_runtime_1.jsx)(joy_1.DialogTitle, { children: "Create new project" }, void 0), (0, jsx_runtime_1.jsx)(joy_1.DialogContent, { children: "Fill in the information of the project." }, void 0), (0, jsx_runtime_1.jsx)("form", Object.assign({ onSubmit: (event) => {
                                event.preventDefault();
                                setDiagramInfoModelOpen(false);
                            } }, { children: (0, jsx_runtime_1.jsxs)(joy_1.Stack, Object.assign({ spacing: 2 }, { children: [(0, jsx_runtime_1.jsxs)(joy_1.FormControl, { children: [(0, jsx_runtime_1.jsx)(joy_1.FormLabel, { children: "Name" }, void 0), (0, jsx_runtime_1.jsx)(joy_1.Input, { autoFocus: true }, void 0)] }, void 0), (0, jsx_runtime_1.jsxs)(joy_1.FormControl, { children: [(0, jsx_runtime_1.jsx)(joy_1.FormLabel, { children: "Description" }, void 0), (0, jsx_runtime_1.jsx)(joy_1.Input, {}, void 0)] }, void 0), (0, jsx_runtime_1.jsx)(joy_1.Button, Object.assign({ type: "submit" }, { children: "Submit" }), void 0)] }), void 0) }), void 0)] }, void 0) }), void 0), (0, jsx_runtime_1.jsxs)(joy_1.Drawer, Object.assign({ open: sidePanelOpen, onClose: () => setSidePanelOpen(false), anchor: "right", hideBackdrop: true, sx: {
                    filter: "drop-shadow(-5px 0px 10px hsla(0, 0%, 50%, 0.50))",
                } }, { children: [(0, jsx_runtime_1.jsx)(joy_1.ModalClose, {}, void 0), (0, jsx_runtime_1.jsx)(Divider_1.default, {}, void 0), (0, jsx_runtime_1.jsxs)(Box_1.default
                    // role="presentation"
                    , Object.assign({ 
                        // role="presentation"
                        onClick: () => setSidePanelOpen(false), onKeyDown: () => setSidePanelOpen(false), sx: {
                            marginTop: "32px",
                        } }, { children: [(0, jsx_runtime_1.jsx)(joy_1.List, { children: ["Inbox", "Starred", "Send email", "Drafts"].map((text) => ((0, jsx_runtime_1.jsx)(joy_1.ListItem, { children: (0, jsx_runtime_1.jsx)(joy_1.ListItemButton, { children: text }, void 0) }, text))) }, void 0), (0, jsx_runtime_1.jsx)(Divider_1.default, {}, void 0), (0, jsx_runtime_1.jsx)(joy_1.List, { children: ["All mail", "Trash", "Spam"].map((text) => ((0, jsx_runtime_1.jsx)(joy_1.ListItem, { children: (0, jsx_runtime_1.jsx)(joy_1.ListItemButton, { children: text }, void 0) }, text))) }, void 0)] }), void 0)] }), void 0)] }, void 0));
};
const domNode = document.getElementById("root");
const root = (0, client_1.createRoot)(domNode);
root.render((0, jsx_runtime_1.jsx)(App, {}, void 0));
//# sourceMappingURL=app.js.map