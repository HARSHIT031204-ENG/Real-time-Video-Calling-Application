import { useCallback, useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();

    // console.log(socket);
    const navigate = useNavigate()
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
        
        navigate(`/room/${room}`)
    }, []);

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);

    return (
        <>
            <h1>Lobby Screen </h1>

            <form onSubmit={handlesubmit}>
                <label htmlFor="email">Email ID : </label>
                <input
                    type="text"
                    placeholder="Email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />{" "}
                <br />
                <label htmlFor="room">Room : </label>
                <input
                    type="text"
                    placeholder="Enter Room "
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />{" "}
                <br />
                <button type="submit">join</button>
            </form>
        </>
    );
};

export default LobbyScreen;
