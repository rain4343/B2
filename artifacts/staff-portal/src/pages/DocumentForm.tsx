import React, { useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Save, FileText, Hash, Calendar, Upload, Paperclip } from "lucide-react";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useCreateDocument,
  useUpdateDocument,
  useGetNextDocumentNumber,
  getGetNextDocumentNumberQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

const statusOptions = ["نوێ", "لە پێداچوونەوەدایە", "پەسەندکراوە", "ڕەتکراوەتەوە", "کۆتاییهاتووە"];

// ── Schemas ───────────────────────────────────────────────────
const createSchema = z.object({
  document_number: z.string().min(1, "ژمارەی نوسراو پێویستە").max(100),
  document_date: z.string().min(1, "بەرواری نوسراو پێویستە"),
  subject: z.string().min(1, "بابەت پێویستە").max(255),
  current_status: z.string().min(1),
  attachment: z
    .instanceof(File, { message: "فایلی PDF پێویستە" })
    .refine((f) => f.type === "application/pdf", "تەنها فایلی PDF قبووڵدەکرێت")
    .refine((f) => f.size <= 10 * 1024 * 1024, "فایلەکە دەبێت کەمتر لە ١٠ مێگابایت بێت"),
});

const editSchema = z.object({
  document_number: z.string().min(1, "ژمارەی نوسراو پێویستە").max(100),
  document_date: z.string().min(1, "بەرواری نوسراو پێویستە"),
  subject: z.string().min(1, "بابەت پێویستە").max(255),
  current_status: z.string().min(1),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

export default function DocumentForm() {
  const [matchNew] = useRoute("/documents/new");
  const [, editParams] = useRoute("/documents/:id/edit");
  const isNew = !!matchNew;
  const documentId = !isNew && editParams?.id ? Number(editParams.id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>("");

  const { data: document, isLoading: loadingDoc } = useGetDocument(documentId as number, {
    query: { enabled: !!documentId, queryKey: getGetDocumentQueryKey(documentId as number) },
  });

  const { data: nextNumberData } = useGetNextDocumentNumber({
    query: { queryKey: getGetNextDocumentNumberQueryKey(), enabled: isNew },
  });

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "نوسراوەکە بە سەرکەوتوویی زیادکرا." });
        setLocation("/documents");
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە دروستکردن", description: err.message, variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "نوسراوەکە بە سەرکەوتوویی نوێکرایەوە." });
        setLocation(`/documents/${documentId}`);
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە نوێکردنەوە", description: err.message, variant: "destructive" });
      },
    },
  });

  // ── Create form ───────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      document_number: "",
      document_date: new Date().toISOString().slice(0, 10),
      subject: "",
      current_status: "نوێ",
    },
  });

  // Auto-fill document number once we get the suggestion
  React.useEffect(() => {
    if (isNew && nextNumberData?.next_number && !createForm.getValues("document_number")) {
      createForm.setValue("document_number", nextNumberData.next_number);
    }
  }, [isNew, nextNumberData, createForm]);

  // ── Edit form ─────────────────────────────────────────────
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      document_number: "",
      document_date: new Date().toISOString().slice(0, 10),
      subject: "",
      current_status: "نوێ",
    },
    values: document
      ? {
          document_number: document.document_number,
          document_date: document.document_date.slice(0, 10),
          subject: document.subject,
          current_status: document.current_status,
        }
      : undefined,
  });

  const onCreateSubmit = (values: CreateFormValues) => {
    createMutation.mutate({
      data: {
        document_number: values.document_number,
        document_date: values.document_date,
        subject: values.subject,
        current_status: values.current_status,
        attachment: values.attachment,
      },
    });
  };

  const onEditSubmit = (values: EditFormValues) => {
    updateMutation.mutate({
      id: documentId as number,
      data: {
        ...values,
        document_date: new Date(values.document_date) as any,
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && loadingDoc) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Shared field renderers ────────────────────────────────
  function DocNumberField({ control }: { control: any }) {
    return (
      <FormField
        control={control}
        name="document_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5" style={ku}>
              <Hash className="h-3.5 w-3.5" /> ژمارەی نوسراو
            </FormLabel>
            <FormControl>
              <Input className="text-right" style={ku} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  function DocDateField({ control }: { control: any }) {
    return (
      <FormField
        control={control}
        name="document_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5" style={ku}>
              <Calendar className="h-3.5 w-3.5" /> بەروار
            </FormLabel>
            <FormControl>
              <Input type="date" className="text-right" style={ku} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  function SubjectField({ control }: { control: any }) {
    return (
      <FormField
        control={control}
        name="subject"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel className="flex items-center gap-1.5" style={ku}>
              <FileText className="h-3.5 w-3.5" /> بابەت
            </FormLabel>
            <FormControl>
              <Input className="text-right" style={ku} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  function StatusField({ control }: { control: any }) {
    return (
      <FormField
        control={control}
        name="current_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel style={ku}>دۆخ</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger style={ku}>
                  <SelectValue placeholder="دۆخ هەڵبژێرە" />
                </SelectTrigger>
              </FormControl>
              <SelectContent style={ku}>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // ── Create mode ───────────────────────────────────────────
  if (isNew) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={ku}>نوسراوی نوێ</h1>
            <p className="text-sm text-muted-foreground" style={ku}>زانیاریەکان پڕبکەوە</p>
          </div>
        </div>

        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle style={ku}>زانیاری نوسراو</CardTitle>
                <CardDescription style={ku}>زانیاری سەرەکی نوسراوەکە</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DocNumberField control={createForm.control} />
                <DocDateField control={createForm.control} />
                <SubjectField control={createForm.control} />
                <StatusField control={createForm.control} />

                {/* PDF file upload */}
                <FormField
                  control={createForm.control}
                  name="attachment"
                  render={({ field: { onChange } }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="flex items-center gap-1.5" style={ku}>
                        <Paperclip className="h-3.5 w-3.5" /> فایلی PDF
                      </FormLabel>
                      <FormControl>
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/5 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                                setFileName(file.name);
                              }
                            }}
                          />
                          {fileName ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                              <Paperclip className="h-4 w-4" />
                              <span style={ku}>{fileName}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground" style={ku}>
                                کلیک بکە بۆ هەڵبژاردنی فایلی PDF
                              </p>
                              <p className="text-xs text-muted-foreground" style={ku}>
                                زۆرترین قەبارە: ١٠ مێگابایت
                              </p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-start gap-4 pb-12">
              <Button type="submit" disabled={isPending} className="min-w-[120px]" style={ku}>
                {isPending ? (
                  "چاوەڕێ بکە..."
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    پاشەکەوتکردن
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild style={ku}>
                <Link href="/documents">پاشگەزبوونەوە</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/documents/${documentId}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={ku}>دەستکاریکردنی نوسراو</h1>
          <p className="text-sm text-muted-foreground" style={ku}>
            {document?.document_number}
          </p>
        </div>
      </div>

      <Form {...editForm}>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle style={ku}>زانیاری نوسراو</CardTitle>
              <CardDescription style={ku}>زانیاری سەرەکی نوسراوەکە دەستکاری بکە</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocNumberField control={editForm.control} />
              <DocDateField control={editForm.control} />
              <SubjectField control={editForm.control} />
              <StatusField control={editForm.control} />

              {document?.file_path && (
                <div className="sm:col-span-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span style={ku}>فایلی هاوپێچکراو: </span>
                  <a
                    href={`/api/documents/uploads/${document.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate"
                    style={ku}
                  >
                    بینینی فایل
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-start gap-4 pb-12">
            <Button type="submit" disabled={isPending} className="min-w-[120px]" style={ku}>
              {isPending ? (
                "چاوەڕێ بکە..."
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  پاشەکەوتکردن
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild style={ku}>
              <Link href={`/documents/${documentId}`}>پاشگەزبوونەوە</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
