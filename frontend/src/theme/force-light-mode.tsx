import { useEffect } from "react";
import { useColorScheme } from "@mui/material/styles";

export default function ForceLightMode() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode("light");
  }, [setMode]);

  return null;
}
