import React, { useState } from "react";
import { Shield, Plus, Trash2 } from "lucide-react";
import { useListRoles, getListRolesQueryKey, useCreateRole, useDeleteRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

export default function Roles() {
  const { data: roles, isLoading, refetch } = useListRoles({ query: { queryKey: getListRolesQueryKey() } });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = useCreateRole({
    mutation: {
      onSuccess: () => {
        toast({ title: "ڕۆڵەکە بە سەرکەوتوویی دروستکرا." });
        refetch();
        setDialogOpen(false);
        setRoleName("");
      },
      onError: (e: any) => toast({ title: "هەڵە", description: e.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteRole({
    mutation: {
      onSuccess: () => {
        toast({ title: "ڕۆڵەکە سڕایەوە." });
        refetch();
        setDeleteId(null);
      },
      onError: (e: any) => {
        toast({ title: "هەڵە", description: e.message, variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const saveRole = () => {
    if (!roleName.trim()) return;
    createMutation.mutate({ data: { name: roleName } });
  };

  return (
    <div className="space-y-6" data-testid="page-roles" style={ku}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">بەڕێوەبردنی ڕۆڵەکان</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی ئاستەکانی دەسەڵات و مافی دەستگەیشتن.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          دروستکردنی ڕۆڵی نوێ
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            لیستی ڕۆڵەکان
          </CardTitle>
          <CardDescription>ڕۆڵەکانی بەردەست کە دەتوانرێ بەسەر فەرمانبەراندا دابەش بکرێن.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs border-b border-t">
                <tr>
                  <th className="px-6 py-4 font-medium text-right">#</th>
                  <th className="px-6 py-4 font-medium text-right">ناوی ڕۆڵ</th>
                  <th className="px-6 py-4 font-medium text-right">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">چاوەڕێ بکە...</td></tr>
                ) : !roles?.length ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">هیچ ڕۆڵێک نەدۆزرایەوە!</td></tr>
                ) : (
                  roles.map((role, index) => (
                    <tr key={role.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 text-muted-foreground text-right">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-foreground text-right">{role.name}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(role.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={ku}
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          سڕینەوە
                        </Button>
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
            <DialogTitle>دروستکردنی ڕۆڵی نوێ</DialogTitle>
            <DialogDescription>ڕۆڵێکی نوێ دروست بکە بۆ دابەشکردن بەسەر فەرمانبەراندا.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1.5 block">ناوی ڕۆڵ</label>
            <Input
              placeholder="بۆ نموونە: بەڕێوەبەری گشتی"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveRole()}
              className="text-right"
              style={ku}
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={ku}>پاشگەزبوونەوە</Button>
            <Button onClick={saveRole} disabled={createMutation.isPending || !roleName.trim()} style={ku}>
              پاشەکەوتکردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={ku}>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی ڕۆڵ؟</AlertDialogTitle>
            <AlertDialogDescription>
              دڵنیایت؟ ئەم ڕۆڵە بە تەواوی دەسڕێتەوە و لە هەموو فەرمانبەرەکانیش جیادەکرێتەوە.
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
