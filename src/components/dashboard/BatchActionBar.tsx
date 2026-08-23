import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { AnimatedDigitGroup } from '@/components/ui/transitions'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Item, ItemPriority, ItemStatus } from '@/db/schema'
import {
  CheckSquare,
  Trash2,
  X,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react'

const BATCH_STATUS_OPTIONS: { label: string; value: ItemStatus; dot: string }[] = [
  { label: 'Move to Backlog', value: 'backlog', dot: 'bg-slate-500' },
  { label: 'Move to In Progress', value: 'in_progress', dot: 'bg-blue-500' },
  { label: 'Move to In Review', value: 'in_review', dot: 'bg-amber-500' },
  { label: 'Mark Completed', value: 'completed', dot: 'bg-emerald-500' },
]

const BATCH_PRIORITY_OPTIONS: { label: string; value: ItemPriority; dot: string }[] = [
  { label: 'Set Urgent', value: 'urgent', dot: 'bg-rose-500' },
  { label: 'Set High', value: 'high', dot: 'bg-orange-500' },
  { label: 'Set Medium', value: 'medium', dot: 'bg-amber-500' },
  { label: 'Set Low', value: 'low', dot: 'bg-teal-500' },
]

interface BatchActionBarProps {
  selectedIds: string[]
  items: Item[]
  onClearSelection: () => void
  onBatchStatusChange: (status: ItemStatus) => void
  onBatchPriorityChange: (priority: ItemPriority) => void
  onBatchDelete: () => void
  isProcessing: boolean
}

export function BatchActionBar({
  selectedIds,
  items,
  onClearSelection,
  onBatchStatusChange,
  onBatchPriorityChange,
  onBatchDelete,
  isProcessing,
}: BatchActionBarProps) {
  if (selectedIds.length === 0) return null

  const selectedItems = items.filter((i) => selectedIds.includes(i.id))

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedItems, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `dashboard_export_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Assignee', 'Due Date', 'Progress', 'Budget']
    const rows = selectedItems.map((i) => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.status,
      i.priority,
      i.category,
      `"${(i.assigneeName || '').replace(/"/g, '""')}"`,
      i.dueDate || '',
      i.progress,
      i.budget,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dashboard_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3.5 shadow-2xl shadow-primary/10 backdrop-blur-xl ring-1 ring-primary/20">
        <div className="flex items-center gap-3">
          <Badge className="h-7 px-3 bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shadow-xs">
            <CheckSquare className="size-3.5" />
            <AnimatedDigitGroup value={selectedIds.length} />
            <span>Selected</span>
          </Badge>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Apply batch updates or export
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status change (p-select-14 style) */}
          <Select
            value=""
            onValueChange={(val) => {
              if (val) {
                onBatchStatusChange(val as ItemStatus)
              }
            }}
            disabled={isProcessing}
          >
            <SelectTrigger aria-label="Batch set status" className="h-8 w-auto min-w-36 bg-background px-2 text-xs font-medium">
              <SelectValue placeholder="Set Status..." />
            </SelectTrigger>
            <SelectPopup>
              {BATCH_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Quick priority change */}
          <Select
            value=""
            onValueChange={(val) => {
              if (val) {
                onBatchPriorityChange(val as ItemPriority)
              }
            }}
            disabled={isProcessing}
          >
            <SelectTrigger aria-label="Batch set priority" className="h-8 w-auto min-w-36 bg-background px-2 text-xs font-medium">
              <SelectValue placeholder="Set Priority..." />
            </SelectTrigger>
            <SelectPopup>
              {BATCH_PRIORITY_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${item.dot}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          {/* Export options */}
          <Button
            variant="outline"
            size="xs"
            onClick={handleExportJSON}
            className="h-8 gap-1 text-xs"
            title="Export selected records as JSON"
          >
            <FileJson className="size-3.5 text-sky-500" />
            <span className="hidden md:inline">JSON</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleExportCSV}
            className="h-8 gap-1 text-xs"
            title="Export selected records as CSV"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-500" />
            <span className="hidden md:inline">CSV</span>
          </Button>

          {/* Bulk delete */}
          <Button
            variant="destructive"
            size="xs"
            onClick={onBatchDelete}
            disabled={isProcessing}
            className="h-8 gap-1 text-xs"
          >
            {isProcessing ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
            <span>Delete</span>
          </Button>

          {/* Deselect all */}
          <button
            onClick={onClearSelection}
            className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Clear selection"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
