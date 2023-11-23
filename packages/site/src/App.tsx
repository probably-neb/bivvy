import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {type Todo} from "@paypals/core/src/todo"
import "./App.css";

function App() {
    const [count, setCount] = useState(0);

    const [todos, setTodos] = useState<Todo[]>([]);
    const [created, setCreated] = useState(0);
    useEffect(() => {
        async function fetchTodos() {
            const todos = await fetch(`${import.meta.env.VITE_API_URL}/todo`)
                .then((response) => response.json())
            setTodos(todos);
        }
        fetchTodos();
    }, [created])

    async function createTodo() {
        await fetch(`${import.meta.env.VITE_API_URL}/todo`, {
            method: 'POST'
        })
        setCreated((created) => created + 1);
    }

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
                <button onClick={() => createTodo()}>
                    Create Todo
                </button>
                {todos.map((todo) => (
                    <div key={todo.id}>{todo.title}</div>
                ))}
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
}

export default App;
