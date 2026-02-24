import { AppStoreContext } from "./state/hooks";
import { store } from "./state/store";

import "./App.css";
import { Counter } from "./components/Counter";

function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}

export default App;
