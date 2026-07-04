import React, { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight, FileText, History, Plus, Download, ClipboardList, Send } from "lucide-react";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useListDocumentLogs,
  getListDocumentLogsQueryKey,
  useCreateDocumentLog,
  useUpdateDocument,
  useListDepartments,
  getListDepartmentsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

function statusColor(status: string): string {
  if (status === "نوێ") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (status.startsWith("ئاڕاستەکرا بۆ")) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (status === "پەسەندکراوە") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (status === "ڕەتکراوەتەوە") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function DocumentDetail() {
  const [, params] = useRoute("/documents/:id");
  const documentId = Number(params?.id);
  const [note, setNote] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const { toast } = useToast();

  const { data: document, isLoading: loadingDoc, refetch: refetchDoc } = useGetDocument(documentId, {
    query: { enabled: !!documentId, queryKey: getGetDocumentQueryKey(documentId) },
  });

  const { data: departments } = useListDepartments({
    query: { queryKey: getListDepartmentsQueryKey() },
  });

  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = useListDocumentLogs(documentId, {
    query: { enabled: !!documentId, queryKey: getListDocumentLogsQueryKey(documentId) },
  });

  const updateDocMutation = useUpdateDocument();

  const createLogMutation = useCreateDocumentLog({
    mutation: {
      onSuccess: () => {
        setNote("");
        setSelectedDept("");
        refetchLogs();
        refetchDoc();
      },
      onError: (err: any) =>
        toast({ title: "هەڵە", description: err.message, variant: "destructive" }),
    },
  });

  const isPending = createLogMutation.isPending || updateDocMutation.isPending;

  // Plain note — no department
  const addNote = () => {
    if (!note.trim()) return;
    createLogMutation.mutate(
      { id: documentId, data: { action: "تێبینی", notes: note || undefined } },
      { onSuccess: () => toast({ title: "تێبینی زیادکرا." }) }
    );
  };

  // Route to department — updates status + logs the action
  const routeToDepartment = () => {
    if (!selectedDept) return;
    const deptName = departments?.find((d) => String(d.id) === selectedDept)?.name ?? selectedDept;
    const newStatus = `ئاڕاستەکرا بۆ: ${deptName}`;
    const action = `نوسراوەکە ئاڕاستەکرا بۆ: ${deptName}`;
    updateDocMutation.mutate(
      { id: documentId, data: { current_status: newStatus } },
      {
        onSuccess: () => {
          createLogMutation.mutate(
            { id: documentId, data: { action, notes: note || undefined } },
            { onSuccess: () => toast({ title: "نوسراوەکە بە سەرکەوتوویی ئاڕاستەکرا.", description: deptName }) }
          );
        },
        onError: (err: any) =>
          toast({ title: "هەڵە", description: err.message, variant: "destructive" }),
      }
    );
  };

  if (loadingDoc) {
    return (
      <div className="p-8 text-center text-muted-foreground" style={ku}>
        چاوەڕێ بکە...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center p-8" style={ku}>
        <h2 className="text-xl font-bold">نوسراوەکە نەدۆزرایەوە</h2>
        <Button asChild className="mt-4">
          <Link href="/documents">گەڕانەوە بۆ نوسراوەکان</Link>
        </Button>
      </div>
    );
  }

  const fileUrl = document.file_path
    ? `/api/documents/uploads/${document.file_path}`
    : null;

  return (
    <div className="space-y-6" data-testid="page-document-detail" style={ku}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/documents">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{document.subject}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{document.document_number}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout: left 2/3, right 1/3 */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left column (2/3): info + new action ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Document info card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                زانیارییەکانی نوسراو
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-muted-foreground font-medium">ژمارەی نوسراو:</dt>
                <dd className="font-semibold">{document.document_number}</dd>

                <dt className="text-muted-foreground font-medium">ڕێکەوت:</dt>
                <dd>{format(new Date(document.document_date), "dd / MM / yyyy")}</dd>

                <dt className="text-muted-foreground font-medium">بابەت:</dt>
                <dd>{document.subject}</dd>

                <dt className="text-muted-foreground font-medium">دروستکەر:</dt>
                <dd>{document.creator_name || "—"}</dd>

                <dt className="text-muted-foreground font-medium">دواین حاڵەت:</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                      statusColor(document.current_status)
                    }`}
                  >
                    {document.current_status}
                  </span>
                </dd>
              </dl>

              {fileUrl && (
                <>
                  <hr className="my-4" />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 text-sm transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    بینین و داگرتنی هاوپێچ (PDF)
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* New action card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                کرداری نوێ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Department routing */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" style={ku}>
                  ئاڕاستەکردن بۆ بەش
                </label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="text-right" style={ku}>
                    <SelectValue placeholder="بەشێک هەڵبژێرە..." />
                  </SelectTrigger>
                  <SelectContent style={ku}>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" style={ku}>
                  هامش
                </label>
                <Textarea
                  placeholder="تێبینییەک بنووسە..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-right"
                  style={ku}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {/* Route to department */}
                <Button
                  onClick={routeToDepartment}
                  disabled={isPending || !selectedDept}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  ئاڕاستەکردن
                </Button>
                {/* Plain note (no department required) */}
                <Button
                  variant="outline"
                  onClick={addNote}
                  disabled={isPending || !note.trim()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  تێبینی
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (1/3): movement history ── */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                مێژووی جووڵەی نوسراو
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <p className="text-center text-muted-foreground py-6 text-sm">چاوەڕێ بکە...</p>
              ) : !logs?.length ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  هیچ جووڵەیەک تۆمار نەکراوە.
                </p>
              ) : (
                <ul className="space-y-0 divide-y">
                  {logs.map((log) => (
                    <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-semibold text-sm">{log.action}</p>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {log.user_name && <span className="block">لەلایەن: {log.user_name}</span>}
                        <span className="block">
                          کات: {format(new Date(log.timestamp), "yyyy/MM/dd - hh:mm a")}
                        </span>
                      </div>
                      {log.notes && (
                        <div className="mt-2 p-2 bg-muted/50 border rounded text-xs">
                          <strong>هامش:</strong>{" "}
                          <span className="italic">{log.notes}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
