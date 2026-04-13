import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Main Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Placeholders for your future pages */}
        <Route
          path="/set-up"
          element={
            <div className="p-10 text-center text-2xl font-bold">
              Setup Page Coming Soon
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="p-10 text-center text-2xl font-bold">
              Login Page Coming Soon
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div className="p-10 text-center text-2xl font-bold">
              Dashboard Coming Soon
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
