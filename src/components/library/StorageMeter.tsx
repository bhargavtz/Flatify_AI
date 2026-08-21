"use client"

import { HardDrive, AlertTriangle } from "lucide-react"

export interface StorageQuotaData {
  bytesUsed: number
  bytesTotal: number
  bytesAvailable: number
  percentUsed: number
  itemsCount: number
  trashBytes: number
  trashCount: number
  isFull: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB"
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  return `${mb.toFixed(1)} MB`
}

export default function StorageMeter({ quota }: { quota: StorageQuotaData | null }) {
  if (!quota) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-chalk/10 bg-slateink/60 px-4 py-3 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const isWarning = quota.percentUsed >= 80
  const isDanger = quota.percentUsed >= 95

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-chalk/10 bg-slateink/80 p-4 text-chalk shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className={`h-4 w-4 ${isDanger ? "text-coral" : isWarning ? "text-saffron" : "text-cobalt"}`} />
          <span className="font-mono text-xs uppercase tracking-wider text-mist">Cloudflare R2 Storage</span>
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-chalk">
          {formatBytes(quota.bytesUsed)} <span className="text-mist font-normal">/ 500 MB</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? "bg-coral" : isWarning ? "bg-saffron" : "bg-cobalt"
          }`}
          style={{ width: `${Math.min(100, Math.max(2, quota.percentUsed))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-mist">
        <span>{quota.itemsCount} creative assets saved</span>
        <span className="font-mono tabular-nums">{quota.percentUsed}% used</span>
      </div>

      {isWarning && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-saffron">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Storage quota nearly full. Delete old assets to make room.</span>
        </div>
      )}
    </div>
  )
}
