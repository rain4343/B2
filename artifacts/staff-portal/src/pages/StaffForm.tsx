import React, { useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Save, Shield, User, Mail, Hash, Building2 } from "lucide-react";
import {
  useGetUser, getGetUserQueryKey,
  useCreateUser,
  useUpdateUser,
  useListDepartments, getListDepartmentsQueryKey,
  useListRoles, getListRolesQueryKey,
  useGetUserRoles, getGetUserRolesQueryKey,
  useAssignRole, useRemoveRole
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

const userSchema = z.object({
  full_name: z.string().min(1, "ناوی تەواو پێویستە").max(150),
  username: z.string().min(1, "ناوی بەکارهێنەر پێویستە").max(50),
  email: z.string().email("ئیمەیڵ هەڵەیە"),
  password: z.string().min(6, "ووشەی نهێنی دەبێت کەمتر نەبێت لە ٦ پیت").or(z.literal("")),
  password_confirmation: z.string().optional(),
  department_id: z.coerce.number().nullable().optional(),
  role_ids: z.array(z.number()).default([])
}).refine((data) => data.password === data.password_confirmation, {
  message: "وشەی نهێنی و دووبارەکردنەوەکەی وەک یەک نین",
  path: ["password_confirmation"]
});

type UserFormValues = z.infer<typeof userSchema>;

export default function StaffForm() {
  const [, params] = useRoute("/staff/:id");
  const isNew = !params?.id || params.id === "new";
  const userId = !isNew ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useGetUser(userId as number, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId as number) }
  });

  const { data: userRoles } = useGetUserRoles(userId as number, {
    query: { enabled: !!userId, queryKey: getGetUserRolesQueryKey(userId as number) }
  });

  const { data: departments } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const { data: roles } = useListRoles({ query: { queryKey: getListRolesQueryKey() } });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "فەرمانبەرەکە بە سەرکەوتوویی زیادکرا." });
        setLocation("/staff");
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە دروستکردن", description: err.message, variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "فەرمانبەرەکە بە سەرکەوتوویی نوێکرایەوە." });
        setLocation("/staff");
      },
      onError: (err: any) => {
        toast({ title: "هەڵە لە نوێکردنەوە", description: err.message, variant: "destructive" });
      }
    }
  });

  const assignRoleMutation = useAssignRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserRolesQueryKey(userId as number) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId as number) });
      }
    }
  });

  const removeRoleMutation = useRemoveRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserRolesQueryKey(userId as number) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId as number) });
      }
    }
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", username: "", email: "", password: "", password_confirmation: "", department_id: null, role_ids: [] }
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (user && !initializedRef.current) {
      form.reset({
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        password: "",
        password_confirmation: "",
        department_id: user.department_id,
        role_ids: userRoles?.map(r => r.id) || []
      });
      initializedRef.current = true;
    }
  }, [user, userRoles, form]);

  useEffect(() => { return () => { initializedRef.current = false; }; }, [userId]);

  const onSubmit = (values: UserFormValues) => {
    if (isNew) {
      if (!values.password) {
        form.setError("password", { message: "ووشەی نهێنی بۆ فەرمانبەری نوێ پێویستە" });
        return;
      }
      const createData = { ...values };
      delete (createData as any).password_confirmation;
      createMutation.mutate({ data: createData as any });
    } else {
      const updateData = { ...values };
      if (!updateData.password) delete (updateData as any).password;
      delete (updateData as any).password_confirmation;
      delete (updateData as any).role_ids;
      updateMutation.mutate({ id: userId as number, data: updateData });
    }
  };

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    if (isNew) {
      const currentRoles = form.getValues().role_ids;
      form.setValue("role_ids", checked ? [...currentRoles, roleId] : currentRoles.filter(id => id !== roleId));
      return;
    }
    if (checked) {
      assignRoleMutation.mutate({ id: userId as number, data: { role_id: roleId } });
    } else {
      removeRoleMutation.mutate({ id: userId as number, roleId });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && loadingUser) {
    return <div className="p-8 text-center text-muted-foreground" style={ku}>چاوەڕێ بکە...</div>;
  }

  const currentFormRoles = form.watch("role_ids");

  return (
    <div className="max-w-3xl space-y-6" data-testid="page-staff-form" style={ku}>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/staff"><ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "زیادکردنی فەرمانبەری نوێ" : "دەستکاریکردنی فەرمانبەر"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNew ? "تۆمارێکی نوێ دروست بکە و دەسەڵات دابنێ." : "زانیاری فەرمانبەر بگۆڕە."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                زانیاری کەسی
              </CardTitle>
              <CardDescription>ناو و زانیاری پەیوەندی فەرمانبەر.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>ناوی تەواو</FormLabel>
                  <FormControl>
                    <Input placeholder="بۆ نموونە: ئەحمەد محەمەد" className="text-right" style={ku} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>ناوی بەکارهێنەر</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="ahmad.m" className="pr-9 text-right" style={ku} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>ئیمەیڵ</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="ahmad@example.com" className="pr-9 text-right" style={ku} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isNew ? "ووشەی نهێنی" : "گۆڕینی ووشەی نهێنی"}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isNew ? "ووشەی نهێنی دروست بکە" : "بۆ نەگۆڕین بەتاڵ بهێڵەرەوە"}
                      style={ku}
                      {...field}
                    />
                  </FormControl>
                  {isNew && <FormDescription>پێویستە بۆ دروستکردنی هەژمار.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password_confirmation" render={({ field }) => (
                <FormItem>
                  <FormLabel>دووبارەکردنەوەی ووشەی نهێنی</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isNew ? "ووشەی نهێنی دووبارە بنووسە" : "دووبارە بنووسەرەوە ئەگەر ووشەی نهێنیت گۆڕی"}
                      style={ku}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Department */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                هۆبە و جێگیرکردن
              </CardTitle>
              <CardDescription>هۆبەی ئەم فەرمانبەرە دیاری بکە.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="department_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>هۆبە</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                    value={field.value ? field.value.toString() : "none"}
                  >
                    <FormControl>
                      <SelectTrigger style={ku}>
                        <SelectValue placeholder="هۆبەیەک هەڵبژێرە" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={ku}>
                      <SelectItem value="none">بێ هۆبە</SelectItem>
                      {departments?.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                ڕۆڵەکان و دەسەڵات
              </CardTitle>
              <CardDescription>
                {isNew ? "ڕۆڵەکان دیاری بکە لەکاتی دروستکردندا." : "گۆڕانکاری لە ڕۆڵەکان دەستبەجێ کاردەکات."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {roles?.map((role) => {
                  const isAssigned = isNew ? currentFormRoles.includes(role.id) : (userRoles?.some(r => r.id === role.id) ?? false);
                  const isRoleChanging = assignRoleMutation.isPending || removeRoleMutation.isPending;
                  return (
                    <div key={role.id} className="flex flex-row-reverse items-start gap-3 rounded-md border p-4 shadow-sm">
                      <Checkbox
                        checked={isAssigned}
                        disabled={!isNew && isRoleChanging}
                        onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
                      />
                      <div className="space-y-1 leading-none flex-1 text-right">
                        <label className="font-medium text-sm leading-none cursor-pointer" style={ku}>
                          {role.name}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-start gap-4 pb-12">
            <Button type="submit" disabled={isPending} className="min-w-[120px]" style={ku}>
              {isPending ? "چاوەڕێ بکە..." : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  پاشەکەوتکردن
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild style={ku}>
              <Link href="/staff">پاشگەزبوونەوە</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
