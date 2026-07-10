import "./App.css";
import { Counter } from "./components/Counter";

// No Provider needed — createYoltra's hooks default to the store in state/yoltra.
function App() {
  return <Counter />;
}

export default App;
