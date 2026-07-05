import type { DataSource } from "@/src/lib/lesson-data";

export function DataSourceNotice({
  source,
  onReconnect
}: {
  source: DataSource | null;
  onReconnect: () => void;
}) {
  if (source !== "demo") return null;

  return (
    <div className="status pending" role="status" data-testid="demo-mode-notice">
      <span>Offline demo mode: changes stay in this browser and do not sync.</span>
      <button type="button" className="secondary" onClick={onReconnect}>
        Retry backend
      </button>
    </div>
  );
}
