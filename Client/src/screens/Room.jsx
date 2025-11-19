import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../services/peersrevice";
function Room() {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleuserjoined = useCallback(({ email, id }) => {
        console.log(`emial is ${email} joined room `);
        setRemoteSocketId(id);
    });

    const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    const handleCallAccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log("Call Accepted!");
        // sendStreams();
    }, []);

    useEffect(() => {
        socket.on("user-joined", handleuserjoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        return () => {
            socket.off("user-joined", handleuserjoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
        };
    }, [socket, handleuserjoined]);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    return (
        <div>
            <h1>room page </h1>
            <h4>{remoteSocketId ? "Connected" : "no one in mettings "}</h4>
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            {myStream && (
                <>
                    <h1>My Stream</h1>
                    <video
                        ref={(video) => {
                            if (video) video.srcObject = myStream;
                        }}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            height: "600px",
                            width: "600px",
                            background: "black",
                        }}
                    />
                </>
            )}
            {remoteStream && (
                <>
                    <h1>Remote Stream</h1>
                    <video
                        ref={(video) => {
                            if (video) video.srcObject = myStream;
                        }}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            height: "600px",
                            width: "600px",
                            background: "black",
                        }}
                        url={remoteStream}
                    />
                </>
            )}
        </div>
    );
}

export default Room;
