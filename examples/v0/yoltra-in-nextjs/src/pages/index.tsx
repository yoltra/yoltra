
import { AppStoreContext } from "@/context/Store.context";
import { store } from "@/state/store";

import { Head } from "@/components/Head.component";
import { MainContent } from "@/components/Content.component";
import { Header } from "@/components/Header.component";

export default function Home() {
  return (
    <AppStoreContext.Provider value={store}>
      <Head />
      <Header />
      <MainContent />
    </AppStoreContext.Provider>
  );
}
