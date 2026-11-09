import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { PeoplePage } from "./pages/PeoplePage";
import { PersonPage } from "./pages/PersonPage";
import { QuestionsPage } from "./pages/QuestionsPage";
import { RequireAuth, SessionProvider } from "./session";
import { AppShell } from "./shell";

export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<QuestionsPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="people/:id" element={<PersonPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
