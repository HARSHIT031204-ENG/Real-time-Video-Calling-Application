import { Server } from "socket.io";


const io = new Server(8000, {
    cors : {
        origin : "http://localhost:5173",
        methods : ["POST", "GET", "PUT"],
        credentials : true
    }
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();


io.on("connection", (socket) => {
    console.log(`Welcome user and user ID : ${socket.id}`);
    socket.on("room:join", (data) => {console.log(data);
        const {email, room} = data 
        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        io.to(room).emit("user:joined", { email, id: socket.id });
        
    })
})

