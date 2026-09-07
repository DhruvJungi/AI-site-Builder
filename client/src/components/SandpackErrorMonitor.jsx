import { useEffect } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";

const SandpackErrorMonitor = ({ onErrorChange }) => {
  const { sandpack } = useSandpack();
  const { error } = sandpack;
  useEffect(() => {
    const message = error?.message || "";
    const isNetworkError = ["Failed to fetch", "col.csbops.io", "ERR_CONNECTION_TIMED_OUT"].some((text) => message.includes(text));
    onErrorChange(!isNetworkError);
  }, [error, onErrorChange]);
  return null;
};

export default SandpackErrorMonitor;
