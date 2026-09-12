import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import StudentExamPage from "./pages/cbt";

const StaffApp = lazy(() => import("./StaffApp"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Routes>
          <Route path="/cbt/:tenantId/:examId" element={<StudentExamPage />} />
          <Route path="/*" element={<StaffApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
