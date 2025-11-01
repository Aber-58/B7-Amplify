import React from 'react';
import './App.css';
import {Route, Routes} from "react-router";
import Admin from "./routes/admin/Admin";
import Invite from "./routes/invite/Invite";
import Join from "./routes/join/Join";
import Live from "./routes/live/Live";
import Login from "./routes/login/Login";
import Poll from "./routes/poll/Poll";
import {Navigation} from "./routes/Navigation";

function App() {
    return <>
        <Routes>
                <Route path={Navigation.ADMIN} element={<Admin />} />
                <Route path={Navigation.INVITE} element={<Invite />} />
                <Route path={Navigation.JOIN} element={<Join/>} />
                <Route path={Navigation.LIVE} element={<Live />} />
                <Route path={Navigation.LOGIN} element={<Login />} />
                <Route path={Navigation.POLL} element={<Poll />} />
        </Routes>
    </>
}

export default App;
