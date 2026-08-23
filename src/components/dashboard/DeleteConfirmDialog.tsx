import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count?: number
  title?: string
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  count = 1,
  title,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  const isMultiple = count > 1

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2 text-rose-600 dark:text-rose-400">
            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/15">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle>
              {isMultiple ? `Delete ${count} Selected Items?` : 'Delete Initiative?'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isMultiple
              ? `Are you sure you want to permanently delete these ${count} initiatives? This action cannot be undone.`
              : `Are you sure you want to delete "${title || 'this initiative'}"? This action cannot be reversed.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogClose render={<Button variant="outline" type="button" />}>
            Cancel
          </AlertDialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
            <span>{isMultiple ? `Delete ${count} Items` : 'Delete Initiative'}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
