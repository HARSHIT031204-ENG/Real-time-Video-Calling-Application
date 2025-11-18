import { useCallback, useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
const LobbyScreen = () => {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();

    // console.log(socket);

    const handlesubmit = useCallback(
        (e) => {
            e.preventDefault();
            socket.emit("room:join", { room, email });
        },
        [email, room, socket]
    );

    useEffect(() => {
        socket.on("room:join", (data) => {console.log(`data coming from backend ${data}`,data);
        });
    }, [socket]);

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
