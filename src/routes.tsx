import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Playground from "./ui/Playground2";

export const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/playground", element: <Playground /> },
  ],
  {
    basename: "/vibe-playground/",
  }
);