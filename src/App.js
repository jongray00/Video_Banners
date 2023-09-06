import React, { useEffect, useRef, useState } from "react";
import * as SignalWire from "@signalwire/js";
import useScreenSize from "use-screen-size";

export default function Video() {
    let [isLoading, setIsLoading] = useState(true);
    let thisMemberId = useRef(null);
    let memberList = useRef([]);
    let screen = useScreenSize();

    // Keep track of the information about the current layout
    let currLayout = useRef(null);

    // Style and position of the overlay
    let [overlayStyle, setOverlayStyle] = useState({ display: "none" });
    let [overlayText, setOverlayText] = useState(""); // Added state for overlay text

    useEffect(() => {
        setupRoom();
        async function setupRoom() {
            let token, room;
            try {
                // Get the token (you can replace this with your token logic)
                token = "ENTER VIDEO TOKEN HERE!!!!!!!"; // Implement your token retrieval logic
                console.log(token);

                try {
                    // Set up the RTC session
                    room = await SignalWire.Video.createRoomObject({
                        token,
                        rootElementId: "temp",
                        video: true
                    });

                    // Event listeners for room and member updates
                    room.on("room.joined", (e) => {
                        thisMemberId.current = e.member_id;
                        memberList.current = e.room.members;
                        console.log(e.room.members);
                        setIsLoading(false);
                    });

                    room.on("layout.changed", (e) => {
                        currLayout.current = e.layout;
                    });

                    // Join the room
                    await room.join();
                } catch (error) {
                    setIsLoading(false);
                    console.error("Something went wrong", error);
                }
            } catch (e) {
                setIsLoading(false);
                console.log(e);
                alert("Error encountered. Check your token retrieval logic.");
            }
        }

        async function fetchToken() {
            // Implement your token retrieval logic here
            const response = await fetch("YOUR_TOKEN_ENDPOINT");
            const data = await response.json();
            return data.token;
        }
    }, []);

    function updateOverlay(e) {
        if (!currLayout.current) return;

        // Mouse coordinates relative to the video element, in percentage (0 to 100)
        const rect = document.getElementById("temp").getBoundingClientRect();
        const x = (100 * (e.clientX - rect.left)) / rect.width;
        const y = (100 * (e.clientY - rect.top)) / rect.height;

        const layer = currLayout.current.layers.find(
            (lyr) =>
                lyr.x < x &&
                x < lyr.x + lyr.width &&
                lyr.y < y &&
                y < lyr.y + lyr.height
        );

        if (layer && layer.reservation !== "fullscreen") {
            const member = memberList.current.find((m) => m.id === layer.member_id);

            if (member) {
                setOverlayStyle({
                    display: "block",
                    position: "absolute",
                    top: layer.y + "%",
                    left: layer.x + "%",
                    width: layer.width + "%",
                    height: layer.height + "%",
                    zIndex: 1,
                    color: "white",
                    background: "rgba(0, 0, 0, 0.7)",
                    padding: "5px",
                    fontSize: "14px",
                    pointerEvents: "none"
                });

                // Display member's name as an overlay
                setOverlayText(member.name);
            } else {
                setOverlayStyle({ display: "none" });
            }
        } else {
            setOverlayStyle({ display: "none" });
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        minHeight: 0.5 * screen.height,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    Loading...
                </div>
            )}
            <div
                id="temp"
                style={{
                    width: "400px",
                    minHeight: 0.5 * screen.height,
                    position: "relative"
                }}
                onMouseMove={updateOverlay}
            >
                <div style={overlayStyle}>
                    {overlayText} {/* Display member's name as overlay text */}
                </div>
            </div>
        </div>
    );
}
