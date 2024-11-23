import {
  ChakraProvider,
  CSSReset,
  ColorModeScript,
  useColorMode,
} from "@chakra-ui/react";
import { RouterProvider } from "react-router-dom";
import { router } from "lib/routes";
import { useEffect } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import {
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
  localWallet,
  trustWallet,
} from "@thirdweb-dev/react";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    localStorage.setItem("colorMode", colorMode); // Store the color mode preference in local storage
  }, [colorMode]);

  return (
    <ThirdwebProvider
      activeChain={"goerli"}
      clientId="d294cd30551655013dfff9988795e8dd"
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
        walletConnect(),
        trustWallet(),
        embeddedWallet({
          auth: {
            options: ["email", "google", "apple", "facebook"],
          },
        }),
        localWallet(),
      ]}
    >
      <ChakraProvider>
        <CSSReset />
        <ColorModeScript
          initialColorMode={localStorage.getItem("colorMode") || "light"}
        />
        {/* Set the initial color mode from local storage */}
        <RouterProvider
          router={router}
          colorMode={colorMode}
          toggleColorMode={toggleColorMode}
        />
      </ChakraProvider>
    </ThirdwebProvider>
  );
}

export default App;
