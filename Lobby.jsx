import { useCallback, useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();
    const navigate = useNavigate();

    const handlesubmit = useCallback(
        (e) => {
            e.preventDefault();
            socket.emit("room:join", { room, email });
        },
        [email, room, socket]
    );

    const handleJoinRoom = useCallback((data) => {
        const { email, room } = data;
        console.log(email, room);
        navigate(`/room/${room}`);
    }, []);

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6">Lobby Screen</h1>

                <form onSubmit={handlesubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email ID :
                        </label>
                        <input
                            type="text"
                            placeholder="Email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="room" className="block text-sm font-medium mb-2">
                            Room :
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Room"
                            id="room"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-lg font-semibold"
                    >
                        Join
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LobbyScreen;
