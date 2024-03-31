'use client'
import './App.css'
import { ApolloProvider } from '@apollo/client';
import client from './api/apolloClient';
import Dashboard from './dashboard.tsx';


function App() {
    return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <h1>Arcan</h1>
            <ApolloProvider client={client}>
                <div className="App">
                    <Dashboard />
                </div>
            </ApolloProvider>
        </div>
    );
}

export default App

