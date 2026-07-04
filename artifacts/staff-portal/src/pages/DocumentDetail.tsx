import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight, FileText, Pencil, History, Plus } from "lucide-react";
import { useGetDocument, getGetDocumentQueryKey, useListDocumentLogs, getListDocumentLogsQueryKey, useCreateDocumentLog } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

const statusColor: Record<string, string> = {
  "نوێ": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "لە پێداچوونەوەدایە": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "پەسەندکراوە": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "ڕەتکراوەتەوە": "bg-destructive/10 text-destructive border-destructive/20",
  "کۆتاییهاتووە": "bg-muted text-muted-foreground border-border",
};

export default function DocumentDetail() {
  const [, params] = useRoute("/documents/:id");
  const documentId = Number(params?.id);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const { data: document, isLoading: loadingDoc } = useGetDocument(documentId, {
    query: { enabled: !!documentId, queryKey: getGetDocumentQueryKey(documentId) }
  });

  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = useListDocumentLogs(documentId, {
    query: { enabled: !!documentId, queryKey: getListDocumentLogsQueryKey(documentId) }
  });

  const createLogMutation = useCreateDocumentLog({
    mutation: {
      onSuccess: () => {
        toast({ title: "تێبینی زیادکرا." });
        setNote("");
        refetchLogs();
      },
      onError: (err: any) => toast({ title: "هەڵە", description: err.message, variant: "destructive" })
    }
  });

  const addNote = () => {
    if (!note.trim()) return;
    createLogMutation.mutate({ id: documentId, data: { action: "تێبینی", notes: note } });
  };

  if (loadingDoc) {
    return <div className="p-8 text-center text-muted-foreground" style={ku}>چاوەڕێ بکە...</div>;
  }

  if (!document) {
    return (
      <div className="text-center p-8" style={ku}>
        <h2 className="text-xl font-bold">نوسراوەکە نەدۆزرایەوە</h2>
        <Button asChild className="mt-4"><Link href="/documents">گەڕانەوە بۆ نوسراوەکان</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-document-detail" style={ku}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/documents"><ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.document_number}</h1>
            <p className="text-muted-foreground mt-1">{document.subject}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/documents/${documentId}/edit`} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> دەستکاری
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              زانیاری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">دۆخ</p>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${statusColor[document.current_status] || "bg-muted text-muted-foreground border-border"}`}>
                {document.current_status}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">بەرواری نوسراو</p>
              <p className="font-medium">{format(new Date(document.document_date), "yyyy-MM-dd")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">دروستکەر</p>
              <p className="font-medium">{document.creator_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">ڕێچکەی فایل</p>
              <p className="font-medium break-all">{document.file_path}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              مێژووی چالاکی
            </CardTitle>
            <CardDescription>هەموو گۆڕانکارییەکان و تێبینییەکانی ئەم نوسراوەیە.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="تێبینییەک بنووسە..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-right"
                style={ku}
                rows={2}
              />
              <Button onClick={addNote} disabled={createLogMutation.isPending || !note.trim()} className="shrink-0 self-end">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {loadingLogs ? (
                <p className="text-center text-muted-foreground py-6">چاوەڕێ بکە...</p>
              ) : !logs?.length ? (
                <p className="text-center text-muted-foreground py-6">هیچ چالاکییەک تۆمار نەکراوە.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 border-b pb-3 last:border-b-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{log.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")}
                        </span>
                      </div>
                      {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                      {log.user_name && (
                        <p className="text-xs text-muted-foreground mt-1">لەلایەن: {log.user_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
