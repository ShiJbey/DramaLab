import { IconButton } from "@mui/joy";
import Alert from "@mui/joy/Alert";
import React from "react";
import { FaWindowClose } from "react-icons/fa";

const EventNotification: React.FC = () => {
	return (
		<div className="event-notification">
			<Alert
				variant="soft"
				endDecorator={
					<IconButton size="sm" variant="plain">
						<FaWindowClose />
					</IconButton>
				}
			>
				Event Description
			</Alert>
		</div>
	);
};

export default EventNotification;
