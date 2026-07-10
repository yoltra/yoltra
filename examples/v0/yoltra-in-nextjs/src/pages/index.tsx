import { MainContent } from "@/components/Content.component";
import { Head } from "@/components/Head.component";
import { Header } from "@/components/Header.component";

// No Provider — createYoltra's hooks default to the store in @/state/yoltra.
export default function Home() {
  return (
    <>
      <Head />
      <Header />
      <MainContent />
    </>
  );
}
