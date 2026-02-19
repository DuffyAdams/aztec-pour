import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QrScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isSecure =
    typeof window !== "undefined" &&
    (window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const [error, setError] = useState<string | null>(
    isSecure ? null : "Camera requires HTTPS or localhost.",
  );

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // Ignore stop errors
    }
    scannerRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isSecure) return;

    const scanner = new Html5Qrcode(el.id);
    scannerRef.current = scanner;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onSuccess = (decodedText: string) => {
      onScan(decodedText);
      stopScanner();
      onClose();
    };

    // Try back camera first, fall back to front camera
    scanner
      .start({ facingMode: "environment" }, config, onSuccess, () => {})
      .catch(() =>
        scanner
          .start({ facingMode: "user" }, config, onSuccess, () => {})
          .catch((err: Error) => {
            const name = err.name ?? "";
            if (name.includes("NotAllowedError")) {
              setError("Camera permission denied. Allow access in browser settings.");
            } else if (name.includes("NotFoundError")) {
              setError("No camera found.");
            } else if (name.includes("NotReadableError")) {
              setError("Camera is in use by another application.");
            } else {
              setError("Could not access camera.");
            }
          }),
      );

    return () => {
      stopScanner();
    };
  }, [isSecure, onScan, onClose, stopScanner]);

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg border border-border bg-black">
      <div id="qr-reader" ref={containerRef} className="w-full" />

      {error && (
        <div className="flex items-center justify-center p-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClose}
          className="gap-1.5 backdrop-blur-md"
        >
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
