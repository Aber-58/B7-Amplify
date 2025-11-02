import React from 'react';
import './App.css';
import {Navigate, Route, Routes} from "react-router";
import Admin from "./routes/admin/Admin";
import Invite from "./routes/invite/Invite";
import Join from "./routes/join/Join";
import Live from "./routes/live/Live";
import Poll from "./routes/poll/Poll";
import Showcase from "./routes/dev/Showcase";
import {Navigation} from "./routes/Navigation";
import Error from "./routes/error/Error";

function App() {
    return <>
        <Routes>
            <Route path={Navigation.ADMIN} element={<Admin/>}/>
            <Route path={Navigation.DEV} element={<Showcase/>}/>
            <Route path={`${Navigation.INVITE}/:uuid`} element={<Invite/>}/>
            <Route path={`${Navigation.JOIN}/:uuid`} element={<Join/>}/>
            <Route path={`${Navigation.LIVE}/:uuid`} element={<Live/>}/>
            <Route path={`${Navigation.POLL}/:uuid`} element={<Poll/>}/>
            <Route path={`${Navigation.ERROR}`} element={<Error/>}/>
            <Route path="*"
                   element={<Navigate to={Navigation.ADMIN} replace/>}/>
        </Routes>
    </>
}

export default App;
