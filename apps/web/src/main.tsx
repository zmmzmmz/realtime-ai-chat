import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./components/App";

createRoot(document.getElementById("app")!).render(<App />);
