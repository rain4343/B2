import React, { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, Building2, Shield, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useListUsers, getListUsersQueryKey, useDeleteUser, useListDepartments, getListDepartmentsQueryKey, useListRoles, getListRolesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ku: React.CSSProperties = { fontFamily: "'Noto Kufi Arabic', sans-serif" };

export default function StaffList() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { toast } = useToast();

  const queryParams = {
    ...(search && { search }),
    ...(deptFilter !== "all" && { department_id: Number(deptFilter) }),
    ...(roleFilter !== "all" && { role_id: Number(roleFilter) }),
  };

  const { data: users, isLoading, refetch } = useListUsers(queryParams, { query: { enabled: true, queryKey: getListUsersQueryKey(queryParams) } });
  const { data: departments } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const { data: roles } = useListRoles({ query: { queryKey: getListRolesQueryKey() } });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "فەرمانبەرەکە بە سەرکەوتوویی سڕایەوە." });
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
    <div className="space-y-6" data-testid="page-staff-list" style={ku}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">لیستی فەرمانبەران</h1>
          <p className="text-muted-foreground mt-1">بەڕێوەبردنی فەرمانبەران، هۆبەکان، و ڕۆڵەکان.</p>
        </div>
        <Button asChild>
          <Link href="/staff/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            زیادکردنی فەرمانبەری نوێ
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە ناو، ئیمەیڵ، یان ناوی بەکارهێنەر..."
            className="pr-9 text-right"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={ku}
          />
        </div>

        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" style={ku}>
            <Building2 className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="هۆبە" />
          </SelectTrigger>
          <SelectContent style={ku}>
            <SelectItem value="all">هەموو هۆبەکان</SelectItem>
            {departments?.map(dept => (
              <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" style={ku}>
            <Shield className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="ڕۆڵ" />
          </SelectTrigger>
          <SelectContent style={ku}>
            <SelectItem value="all">هەموو ڕۆڵەکان</SelectItem>
            {roles?.map(role => (
              <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-right">#</th>
                <th className="px-4 py-3 font-medium text-right">فەرمانبەر</th>
                <th className="px-4 py-3 font-medium text-right">هۆبە</th>
                <th className="px-4 py-3 font-medium text-right">ڕۆڵەکان</th>
                <th className="px-4 py-3 font-medium text-right">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">چاوەڕێ بکە...</td></tr>
              ) : !users?.length ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">هیچ فەرمانبەرێک نەدۆزرایەوە!</td></tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-4 text-muted-foreground text-right">{index + 1}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-medium text-foreground">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{user.email} &bull; @{user.username}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {user.department_name || "بێ هۆبە"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {user.roles && user.roles.length > 0 ? user.roles.map(role => (
                          <span key={role.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-muted/50 text-muted-foreground">
                            {role.name}
                          </span>
                        )) : (
                          <span className="text-xs text-muted-foreground italic">بێ ڕۆڵ</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" style={ku}>
                          <DropdownMenuItem asChild>
                            <Link href={`/staff/${user.id}`} className="flex items-center cursor-pointer">
                              <Pencil className="ml-2 h-4 w-4" />
                              دەستکاری
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setDeleteId(user.id)}>
                            <Trash2 className="ml-2 h-4 w-4" />
                            سڕینەوە
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={ku}>
          <AlertDialogHeader>
            <AlertDialogTitle>دڵنیایت لە سڕینەوە؟</AlertDialogTitle>
            <AlertDialogDescription>
              ئەم کردارە گەڕانەوەی نییە. فەرمانبەرەکە بە تەواوی لە سیستەم دەسڕێتەوە.
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
