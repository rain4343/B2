import React, { useState } from "react";
import { Link } from "wouter";
import { FileText, Plus, Search, Eye, Trash2 } from "lucide-react";
import { useListDocuments, getListDocumentsQueryKey, useDeleteDocument } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

const statusOptions = ["نوێ", "لە پێداچوونەوەدایە", "پەسەندکراوە", "ڕەتکراوەتەوە", "کۆتاییهاتووە"];

// Matches original Blade str_contains logic:
// contains ئاڕاستەکرا → warning/amber
// contains ئەنجامدرا  → success/green
// else                → info/blue
function statusBadgeClass(status: string): string {
  if (status.includes("ئاڕاستەکرا")) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (status.includes("ئەنجامدرا"))  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
}

export default function Documents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const queryParams = {
    ...(search && { search }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  };

  const { data: documents, isLoading, refetch } = useListDocuments(queryParams, { query: { queryKey: getListDocumentsQueryKey(queryParams) } });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "نوسراوەکە بە سەرکەوتوویی سڕایەوە." });
        refetch();
        setDeleteId(null);
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە سڕینەوە.", description: err.message, variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  return (
    <div className="space-y-6" data-testid="page-documents" style={ku}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">بەڕێوەبردنی نوسراوەکان</h1>
          <p className="text-muted-foreground mt-1">نوسراوی فەرمی و کاغەزەکانی ڕێکخراوەکە بەدواداچوون بکە.</p>
        </div>
        <Button asChild>
          <Link href="/documents/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            زیادکردنی نوسراوی نوێ
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە بابەت..."
            className="pr-9 text-right"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={ku}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" style={ku}>
            <SelectValue placeholder="دۆخ" />
          </SelectTrigger>
          <SelectContent style={ku}>
            <SelectItem value="all">هەموو دۆخەکان</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            لیستی نوسراوەکان
          </CardTitle>
          <CardDescription>هەموو نوسراوی تۆمارکراو لە سیستەم.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs border-b border-t">
                <tr>
                  <th className="px-4 py-3 font-medium text-right">ژ. نوسراو</th>
                  <th className="px-4 py-3 font-medium text-right">ڕێکەوت</th>
                  <th className="px-4 py-3 font-medium text-right">بابەت</th>
                  <th className="px-4 py-3 font-medium text-right">دروستکەر</th>
                  <th className="px-4 py-3 font-medium text-right">دواین حاڵەت</th>
                  <th className="px-4 py-3 font-medium text-right">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">چاوەڕێ بکە...</td></tr>
                ) : !documents?.length ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">هیچ نوسراوێک نەدۆزرایەوە!</td></tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-4 text-right font-medium">
                        <Link href={`/documents/${doc.id}`} className="hover:underline text-primary">
                          {doc.document_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {format(new Date(doc.document_date), "yyyy-MM-dd")}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground">{doc.subject}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{doc.creator_name || "—"}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${statusBadgeClass(doc.current_status)}`}>
                          {doc.current_status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild className="h-8" style={ku}>
                            <Link href={`/documents/${doc.id}`}>
                              <Eye className="h-3.5 w-3.5 ml-1" /> بینین
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(doc.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={ku}>
          <AlertDialogHeader>
            <AlertDialogTitle>دڵنیایت لە سڕینەوە؟</AlertDialogTitle>
            <AlertDialogDescription>
              ئەم کردارە گەڕانەوەی نییە. نوسراوەکە و هەموو تۆمارەکانی بە تەواوی دەسڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "چاوەڕێ بکە..." : "سڕینەوە"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
