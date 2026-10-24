import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LeadScoringEngine } from "./LeadScoringEngine";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Application root was not found.");

createRoot(root).render(
  <StrictMode>
    <LeadScoringEngine />
  </StrictMode>
);
