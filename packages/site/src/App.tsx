import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { api } from "./api";

function App() {
    const [count, setCount] = useState(0);

    const todos = api.todos.list.useQuery();

    return (
        <>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img
                        src={reactLogo}
                        className="logo react"
                        alt="React logo"
                    />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <div className="card">
                {todos.data ? (
                    todos.data.map((todo) => (
                        <div key={todo.id}>{todo.title}</div>
                    ))
                ) : (
                    <p>Loading...</p>
                )}
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#145277] to-[#83D0CB]">
            </main>
        </>
    );
}

export default App;
