import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { courses } from "./courses";

type TestCourse = { id: string; title: string; price: number; visible: boolean };
type TestState = {
  completed: number[]; passed: boolean; notes: string[];
  withdrawal: "none" | "pending" | "approved";
  catalog: TestCourse[]; studentActive: boolean;
  questions: string[];
};
function initial(): TestState {
  return { completed: [], passed: false, notes: ["", "", ""], withdrawal: "none",
    catalog: courses.map((c) => ({ id: c.id, title: c.title.en, price: c.price, visible: true })),
    studentActive: true, questions: [] };
}
const Context = createContext<{ state: TestState; update: (fn: (s: TestState) => TestState) => void; reset: () => void; ready: boolean } | null>(null);
const STORAGE = "cs-sandbox-v1";
export function MockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (saved && Array.isArray(saved.completed) && Array.isArray(saved.catalog) && Array.isArray(saved.notes) && Array.isArray(saved.questions)) setState({ ...initial(), ...saved });
    } catch { /* Invalid browser data is replaced by a fresh sample. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* Private browser mode still supports this session. */ } } }, [ready, state]);
  return <Context.Provider value={{ state, update: setState, reset: () => setState(initial()), ready }}>{children}</Context.Provider>;
}
export function useMock() {
  const value = useContext(Context);
  if (!value) throw new Error("MockProvider required");
  return value;
}
