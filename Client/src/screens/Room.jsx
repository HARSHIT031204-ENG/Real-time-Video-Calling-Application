import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../services/peersrevice";
import { useNavigate } from "react-router-dom";

function Room() {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);

    const navigate = useNavigate();

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const sendStreams = useCallback(() => {
        const senders = peer.peer.getSenders();
        myStream.getTracks().forEach((track) => {
            const alreadyAdded = senders.find(
                (sender) => sender.track === track
            );
            if (!alreadyAdded) {
                peer.peer.addTrack(track, myStream);
            }
        });
    }, [myStream]);

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

    const handleCallAccepted = useCallback(
        ({ from, ans }) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
        },
        [sendStreams]
    );

    const handleMicToggle = useCallback(() => {
        if (!myStream) return;

        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    }, [myStream]);

    const handleCameraToggle = useCallback(() => {
        if (!myStream) return;

        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    }, [myStream]);

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener(
                "negotiationneeded",
                handleNegoNeeded
            );
        };
    }, [handleNegoNeeded]);

    const handleEndCall = useCallback(() => {
        // stop local stream
        if (myStream) {
            myStream.getTracks().forEach((track) => track.stop());
        }

        // stop remote stream
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }

        // close WebRTC connection
        peer.peer.close();

        // 🔥 notify the other peer that call has ended
        socket.emit("call:end", { to: remoteSocketId });

        console.log("Call ended");

        navigate("/");
    }, [myStream, remoteStream, socket, remoteSocketId]);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        socket.on("user-joined", handleuserjoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncomming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off("user-joined", handleuserjoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncomming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        };
    }, [
        socket,
        handleuserjoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
    ]);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    useEffect(() => {
        socket.on("call:ended", () => {
            if (remoteStream)
                remoteStream.getTracks().forEach((track) => track.stop());
            if (myStream) myStream.getTracks().forEach((track) => track.stop());
            peer.peer.close();
            console.log("Remote user ended the call");
            navigate("/");
        });

        return () => socket.off("call:ended");
    }, [socket, myStream, remoteStream]);

    useEffect(() => {
        socket.on("call:ended", () => {
            peer.peer.close();

            if (myStream) myStream.getTracks().forEach((track) => track.stop());
            if (remoteStream)
                remoteStream.getTracks?.forEach((track) => track.stop());

            console.log("Remote user ended the call");
        });

        return () => socket.off("call:ended");
    }, [socket, myStream, remoteStream]);

    const handleScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });

            const screenTrack = screenStream.getVideoTracks()[0];

            // replace video track in peer connection
            const sender = peer.peer
                .getSenders()
                .find((s) => s.track.kind === "video");
            sender.replaceTrack(screenTrack);

            // update your local preview
            if (myStream) {
                myStream.removeTrack(myStream.getVideoTracks()[0]);
                myStream.addTrack(screenTrack);
                setMyStream(screenStream);
            }

            // when screen sharing stops, switch back to camera
            screenTrack.onended = async () => {
                const cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                const cameraTrack = cameraStream.getVideoTracks()[0];
                const camSender = peer.peer
                    .getSenders()
                    .find((s) => s.track.kind === "video");
                camSender.replaceTrack(cameraTrack);

                cameraStream.getVideoTracks().forEach((track) => {
                    myStream.addTrack(track);
                });

                setMyStream(cameraStream);
            };
        } catch (err) {
            console.error("Screen share failed:", err);
        }
    }, [myStream]);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6 gap-6">
            <h1 className="text-4xl font-bold">Room Page</h1>
            <h4 className="text-lg">
                {remoteSocketId ? "Connected 🔥" : "No one in meeting 😕"}
            </h4>

            <div className="flex gap-4">
                {myStream && (
                    <button
                        onClick={sendStreams}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                    >
                        Send Stream
                    </button>
                )}
                {remoteSocketId && (
                    <button
                        onClick={handleCallUser}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                    >
                        CALL
                    </button>
                )}
            </div>

            {myStream && (
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-semibold mb-2">My Stream</h1>
                    <video
                        ref={(video) => {
                            if (video) video.srcObject = myStream;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-[600px] h-[400px] bg-black rounded-lg shadow-lg object-cover"
                    />
                </div>
            )}

            {remoteStream && (
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-semibold mb-2">
                        Remote Stream
                    </h1>
                    <video
                        ref={(video) => {
                            if (video) video.srcObject = remoteStream;
                        }}
                        autoPlay
                        playsInline
                        className="w-[600px] h-[400px] bg-black rounded-lg shadow-lg object-cover"
                    />
                </div>
            )}

            {remoteSocketId && (
                <button
                    onClick={handleEndCall}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
                >
                    End Call
                </button>
            )}

            {myStream && (
                <button
                    onClick={handleScreenShare}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold"
                >
                    Share Screen
                </button>
            )}

            <div className="flex gap-4 justify-center my-4">
                {/* Mic Toggle */}
                <button
                    onClick={handleMicToggle}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                        isMicOn
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-600"
                    }`}
                >
                    {isMicOn ? "Mute Mic 🎤" : "Unmute Mic 🔇"}
                </button>

                {/* Camera Toggle */}
                <button
                    onClick={handleCameraToggle}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                        isCameraOn
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-600"
                    }`}
                >
                    {isCameraOn ? "Camera Off 📷" : "Camera On 📷"}
                </button>

                {/* Screen Share */}
                <button
                    onClick={handleScreenShare}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold"
                >
                    Share Screen 🖥
                </button>
            </div>
        </div>
    );
}

export default Room;
