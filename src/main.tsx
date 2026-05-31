import { configureRuntime } from "./runtime";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context";
import { CallV2SocketProvider } from "./providers/CallV2SocketProvider";
import { Toaster } from "sonner";
import App from "./App.tsx";
import "./styles/globals.css";
import IncomingCallModal from "./components/call/IncomingCallModal";
import OutgoingCallModal from "./components/call/OutgoingCallModal";
import ActiveCallView from "./components/call/ActiveCallView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

configureRuntime({
  apiUrl: import.meta.env.VITE_API_URL || "/v1",
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CallV2SocketProvider>
          <Toaster richColors />
          <App />
          <IncomingCallModal />
          <OutgoingCallModal />
          <ActiveCallView />
        </CallV2SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
