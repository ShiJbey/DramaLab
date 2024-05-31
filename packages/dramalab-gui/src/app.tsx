import { createRoot } from "react-dom/client";
import React, { useRef } from "react";
import { Stage, Layer, Star, Text } from "react-konva";
import {
	FaPlus,
	FaMinus,
	FaStepForward,
	FaPlay,
	FaStop,
	FaMousePointer,
	FaVectorSquare,
	FaUserPlus,
	FaHeart,
	FaEraser,
	FaCog,
} from "react-icons/fa";
import ButtonGroup from "@mui/joy/ButtonGroup";
import IconButton from "@mui/joy/IconButton";
import Divider from "@mui/joy/Divider";
import Box from "@mui/joy/Box";
import {
	Button,
	DialogContent,
	DialogTitle,
	Drawer,
	FormControl,
	FormLabel,
	Input,
	List,
	ListItem,
	ListItemButton,
	Modal,
	ModalDialog,
	ModalClose,
	Stack,
} from "@mui/joy";
import EventNotification from "./EventNotification";
import BackgroundGridLayer from "./BackgroundGridLayer";

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
	const [stars, setStars] = React.useState([]);
	const [diagramInfoModelOpen, setDiagramInfoModelOpen] =
		React.useState<boolean>(false);
	const [sidePanelOpen, setSidePanelOpen] = React.useState<boolean>(false);
	const stage = useRef(null);

	const handleDragStart = (e: any) => {
		const id = e.target.id();
		setStars(
			stars.map((star) => {
				return {
					...star,
					isDragging: star.id === id,
				};
			})
		);
	};
	const handleDragEnd = (e: any) => {
		setStars(
			stars.map((star) => {
				return {
					...star,
					isDragging: false,
				};
			})
		);
	};

	const handleCharacterClicked = (e: any) => {
		console.log("Clicked: " + e.target.id().toString());
	};

	return (
		<>
			<Stage
				ref={stage}
				width={window.innerWidth}
				height={window.innerHeight}
				draggable={true}
				onDblClick={(e: any) => {
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
				}}
			>
				<Layer>
					{stars.map((star) => (
						<Star
							key={star.id}
							id={star.id}
							x={star.x}
							y={star.y}
							numPoints={5}
							innerRadius={20}
							outerRadius={40}
							fill="#89b717"
							opacity={1.0}
							draggable
							rotation={star.rotation}
							shadowColor="black"
							shadowBlur={10}
							shadowOpacity={0.6}
							shadowOffsetX={star.isDragging ? 10 : 5}
							shadowOffsetY={star.isDragging ? 10 : 5}
							scaleX={star.isDragging ? 1.2 : 1}
							scaleY={star.isDragging ? 1.2 : 1}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							onClick={handleCharacterClicked}
						/>
					))}
				</Layer>
				<BackgroundGridLayer gridSize={100} />
			</Stage>
			<div className="name-bar">
				<Box
					sx={{
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
					}}
				>
					<h2>DramaLab</h2>
					<Divider orientation="vertical" inset="none" />
					<Button variant="plain" onClick={() => setDiagramInfoModelOpen(true)}>
						Diagram Name
					</Button>
				</Box>
			</div>
			<div className="toolbar">
				<ButtonGroup
					variant="solid"
					orientation="vertical"
					size="sm"
					aria-label="outlined primary button group"
				>
					<IconButton>
						<FaMousePointer />
					</IconButton>
					<IconButton>
						<FaVectorSquare />
					</IconButton>
					<IconButton>
						<FaUserPlus onClick={() => setSidePanelOpen(true)} />
					</IconButton>
					<IconButton>
						<FaHeart />
					</IconButton>
					<IconButton>
						<FaEraser />
					</IconButton>
				</ButtonGroup>
			</div>
			<div className="sim-controls-bar">
				<ButtonGroup
					variant="solid"
					size="sm"
					aria-label="outlined primary button group"
				>
					<IconButton>
						<FaStepForward />
					</IconButton>
					<IconButton>
						<FaPlay />
					</IconButton>
					<IconButton>
						<FaStop />
					</IconButton>
				</ButtonGroup>
			</div>
			<div className="notification-panel">
				<EventNotification />
				<EventNotification />
				<EventNotification />
				<EventNotification />
				<EventNotification />
				<EventNotification />
			</div>
			<div className="zoom-toolbar">
				<ButtonGroup
					variant="solid"
					size="sm"
					aria-label="outlined primary button group"
				>
					<IconButton>
						<FaPlus />
					</IconButton>
					<IconButton>
						<FaMinus />
					</IconButton>
				</ButtonGroup>
			</div>
			<Modal
				open={diagramInfoModelOpen}
				onClose={() => setDiagramInfoModelOpen(false)}
			>
				<ModalDialog>
					<DialogTitle>Create new project</DialogTitle>
					<DialogContent>Fill in the information of the project.</DialogContent>
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
							event.preventDefault();
							setDiagramInfoModelOpen(false);
						}}
					>
						<Stack spacing={2}>
							<FormControl>
								<FormLabel>Name</FormLabel>
								<Input autoFocus />
							</FormControl>
							<FormControl>
								<FormLabel>Description</FormLabel>
								<Input />
							</FormControl>
							<Button type="submit">Submit</Button>
						</Stack>
					</form>
				</ModalDialog>
			</Modal>

			<Drawer
				open={sidePanelOpen}
				onClose={() => setSidePanelOpen(false)}
				anchor="right"
				hideBackdrop={true}
				sx={{
					filter: "drop-shadow(-5px 0px 10px hsla(0, 0%, 50%, 0.50))",
				}}
			>
				<ModalClose />
				<Divider />
				<Box
					// role="presentation"
					onClick={() => setSidePanelOpen(false)}
					onKeyDown={() => setSidePanelOpen(false)}
					sx={{
						marginTop: "32px",
					}}
				>
					<List>
						{["Inbox", "Starred", "Send email", "Drafts"].map((text) => (
							<ListItem key={text}>
								<ListItemButton>{text}</ListItemButton>
							</ListItem>
						))}
					</List>
					<Divider />
					<List>
						{["All mail", "Trash", "Spam"].map((text) => (
							<ListItem key={text}>
								<ListItemButton>{text}</ListItemButton>
							</ListItem>
						))}
					</List>
				</Box>
			</Drawer>
		</>
	);
};

const domNode = document.getElementById("root");

const root = createRoot(domNode);

root.render(<App />);
