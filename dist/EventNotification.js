"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const joy_1 = require("@mui/joy");
const Alert_1 = __importDefault(require("@mui/joy/Alert"));
const fa_1 = require("react-icons/fa");
const EventNotification = () => {
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "event-notification" }, { children: (0, jsx_runtime_1.jsx)(Alert_1.default, Object.assign({ variant: "soft", endDecorator: (0, jsx_runtime_1.jsx)(joy_1.IconButton, Object.assign({ size: "sm", variant: "plain" }, { children: (0, jsx_runtime_1.jsx)(fa_1.FaWindowClose, {}, void 0) }), void 0) }, { children: "Event Description" }), void 0) }), void 0));
};
exports.default = EventNotification;
//# sourceMappingURL=EventNotification.js.map