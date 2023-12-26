import { HomePage } from "@/home/home";
import { fade } from "@/lib/fade";

function App() {
    return (
        <>
            <main class={`min-h-screen bg-gradient-to-br ${fade}`}>
                <HomePage />
            </main>
        </>
    );
}

export default App;
