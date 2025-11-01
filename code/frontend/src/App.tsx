import React from 'react';
import './App.css';
import {Route, Routes} from "react-router";
import Admin from "./routes/admin/Admin";
import Invite from "./routes/invite/Invite";
import Join from "./routes/join/Join";
import Live from "./routes/live/Live";
import Login from "./routes/login/Login";
import Poll from "./routes/poll/Poll";
import Error from "./routes/error/Error";

function App() {
    return <>
        <Routes>
                <Route path="admin" element={<Admin />} />
                <Route path="invite/:uuid" element={<Invite />} />
                <Route path="join" element={<Join/>} />
                <Route path="live" element={<Live />} />
                <Route path="login" element={<Login />} />
                <Route path="poll" element={<Poll />} />
                <Route path="error" element={<Error />} />
        </Routes>
    </>
}

export default App;
