import { configureRuntime } from "./runtime";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { AuthProvider, LanguageProvider } from "./context";
import { DraftProvider } from "./context/DraftContext";
import { CallV2SocketProvider } from "./providers/CallV2SocketProvider";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./styles/globals.css";
import IncomingCallModal from "./components/call/IncomingCallModal";
import OutgoingCallModal from "./components/call/OutgoingCallModal";
import ActiveCallView from "./components/call/ActiveCallView";
import { installLocalizedToastMessages } from "./utils/localizedToast";

configureRuntime({
  apiUrl: import.meta.env.VITE_API_URL || "/v1",
});

installLocalizedToastMessages();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <DraftProvider>
            <CallV2SocketProvider>
          <Toaster 
            richColors 
            position="top-center" 
            toastOptions={{
              className: 'text-[15px] font-medium p-4',
            }}
          />
          <App />
          <IncomingCallModal />
          <OutgoingCallModal />
          <ActiveCallView />
            </CallV2SocketProvider>
          </DraftProvider>
        </AuthProvider>
      </LanguageProvider>
  </BrowserRouter>
  </QueryClientProvider>,
);
