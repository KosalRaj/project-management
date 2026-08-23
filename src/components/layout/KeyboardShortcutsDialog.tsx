import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUT_GROUPS = [
  {
    title: 'Global & Navigation',
    items: [
      { key: '⌘ K / Ctrl K', desc: 'Open Global Command Palette' },
      { key: '?', desc: 'Show Keyboard Shortcuts Cheat Sheet' },
      { key: 'G then T', desc: 'Go to Tasks & Issues Explorer' },
      { key: 'G then P', desc: 'Go to Projects Hub' },
      { key: 'G then A', desc: 'Go to Portfolio Analytics' },
      { key: 'G then U', desc: 'Go to Team & Users Directory' },
      { key: 'G then S', desc: 'Go to Workspace Settings' },
    ],
  },
  {
    title: 'Creation & Actions',
    items: [
      { key: 'C', desc: 'Create New Task' },
      { key: 'P', desc: 'Create New Project' },
      { key: 'Esc', desc: 'Close open dialog, modal, or drawer' },
      { key: 'Enter', desc: 'Confirm action / submit dialog' },
    ],
  },
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Keyboard className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Keyboard Shortcuts</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Speed up your sprint workflows with Linear & Jira hotkeys.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogPanel className="space-y-4 py-2">
          {SHORTCUT_GROUPS.map((grp) => (
            <div key={grp.title} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                {grp.title}
              </span>
              <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 overflow-hidden">
                {grp.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-foreground/90 font-medium">{item.desc}</span>
                    <kbd className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-background border border-border/80 text-foreground shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DialogPanel>

        <DialogFooter className="mt-2">
          <DialogClose render={<Button size="sm" variant="outline" className="cursor-pointer" />}>
            Got it
          </DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
