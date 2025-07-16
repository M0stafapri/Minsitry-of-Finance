import React, { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SettlementDialog({
  open,
  onOpenChange,
  tripToSettle,
  onConfirm
}) {
  // إذا تم فتح الحوار، ننفذ التأكيد مباشرة ونغلق الحوار
  useEffect(() => {
    if (open && tripToSettle) {
      onConfirm();
      onOpenChange(false);
    }
  }, [open, tripToSettle, onConfirm, onOpenChange]);

  // لا نعرض أي واجهة مستخدم حيث سيتم تنفيذ العملية تلقائيًا
  return null;
}
