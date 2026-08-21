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
import type { SafeUser } from '@/db/schema'
import { Trash2 } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: SafeUser | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: DeleteUserDialogProps) {
  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <Trash2 className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold">
                Delete Team Member
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
                Are you sure you want to remove <strong className="text-foreground">{user.name}</strong> ({user.email})?
                This will permanently revoke their workspace access and delete active sessions.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" size="sm" disabled={isDeleting} />}>
            Cancel
          </AlertDialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting && <Spinner className="size-3.5" />}
            Delete User
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
