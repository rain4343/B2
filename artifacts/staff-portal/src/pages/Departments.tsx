import React, { useState } from "react";
import { Building2, Pencil, Trash2, Plus, Eye } from "lucide-react";
import { Link } from "wouter";
import {
  useListDepartments, getListDepartmentsQueryKey,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

export default function Departments() {
  const { data: departments, isLoading, refetch } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<{ id: number, name: string } | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "هۆبەکە بە سەرکەوتوویی دروستکرا." });
        refetch();
        closeDialog();
      },
      onError: (e: any) => toast({ title: "هەڵە", description: e.message, variant: "destructive" })
    }
  });

  const updateMutation = useUpdateDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "هۆبەکە بە سەرکەوتوویی نوێکرایەوە." });
        refetch();
        closeDialog();
      },
      onError: (e: any) => toast({ title: "هەڵە", description: e.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteDepartment({
    mutation: {
      onSuccess: () => {
        toast({ title: "هۆبەکە بە سەرکەوتوویی سڕایەوە." });
        refetch();
        setDeleteId(null);
      },
      onError: (e: any) => {
        toast({ title: "هەڵە", description: e.message, variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const openNew = () => { setEditingDept(null); setDeptName(""); setDialogOpen(true); };
  const openEdit = (dept: any) => { setEditingDept(dept); setDeptName(dept.name); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingDept(null); setDeptName(""); };

  const saveDept = () => {
    if (!deptName.trim()) return;
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, data: { name: deptName } });
    } else {
      createMutation.mutate({ data: { name: deptName } });
    }
  };

  return (
    <div className="space-y-6" data-testid="page-departments" style={ku}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">بەڕێوەبردنی هۆبەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی یەکەکانی ڕێکخراوەکە.</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          دروستکردنی هۆبەی نوێ
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            لیستی هۆبەکان
          </CardTitle>
          <CardDescription>هەموو هۆبە و یەکەکانی ڕێکخراوەکە.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs border-b border-t">
                <tr>
                  <th className="px-6 py-4 font-medium text-right">#</th>
                  <th className="px-6 py-4 font-medium text-right">ناوی هۆبە</th>
                  <th className="px-6 py-4 font-medium text-right">بەرواری دروستکردن</th>
                  <th className="px-6 py-4 font-medium text-right">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">چاوەڕێ بکە...</td></tr>
                ) : !departments?.length ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">هیچ هۆبەیەک نەدۆزرایەوە!</td></tr>
                ) : (
                  departments.map((dept, index) => (
                    <tr key={dept.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 text-muted-foreground text-right">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-foreground text-right">
                        <Link href={`/departments/${dept.id}`} className="hover:underline font-semibold text-primary">
                          {dept.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-right">
                        {format(new Date(dept.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" asChild className="h-8" style={ku}>
                            <Link href={`/departments/${dept.id}`}>
                              <Eye className="h-3.5 w-3.5 ml-1" /> فەرمانبەران
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(dept)} className="h-8" style={ku}>
                            <Pencil className="h-3.5 w-3.5 ml-1" /> دەستکاری
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(dept.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={ku}>
          <DialogHeader>
            <DialogTitle>{editingDept ? "دەستکاریکردنی هۆبە" : "دروستکردنی هۆبەی نوێ"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "ناوی هۆبەکە بگۆڕە." : "هۆبەیەکی نوێ دروست بکە بۆ ڕێکخراوەکە."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">ناوی هۆبە</label>
            <Input
              placeholder="بۆ نموونە: هۆبەی ژمێریاری"
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveDept()}
              className="text-right"
              style={ku}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={closeDialog} style={ku}>پاشگەزبوونەوە</Button>
            <Button onClick={saveDept} disabled={createMutation.isPending || updateMutation.isPending || !deptName.trim()} style={ku}>
              پاشەکەوتکردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={ku}>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی هۆبە؟</AlertDialogTitle>
            <AlertDialogDescription>
              دڵنیایت؟ هۆبەکە بە تەواوی دەسڕێتەوە. فەرمانبەرانی ئەم هۆبەیە بێ هۆبە دەبن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel style={ku}>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              style={ku}
            >
              {deleteMutation.isPending ? "چاوەڕێ بکە..." : "سڕینەوە"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
