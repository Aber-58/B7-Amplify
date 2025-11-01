import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
    function testAPI() {
        fetch("/api/status").then(data => data.text()).then((text) => alert(`From Backend: ${text}`))
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <button onClick={() => testAPI()}>Check Backend Connection</button>
            </header>
        </div>
    );
}

export default App;
