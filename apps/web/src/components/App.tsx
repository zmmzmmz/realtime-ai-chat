import { Button, HeroUIProvider } from "@heroui/react";

function App() {
  return (
    <Button color="primary" className="m-2">
      Click Me
    </Button>
  );
}

export default function Container() {
  return (
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  );
}
