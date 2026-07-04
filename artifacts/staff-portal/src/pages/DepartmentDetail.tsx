import React from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Building2, Users } from "lucide-react";
import { useGetDepartment, getGetDepartmentQueryKey, useGetDepartmentStaff, getGetDepartmentStaffQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DepartmentDetail() {
  const [, params] = useRoute("/departments/:id");
  const deptId = Number(params?.id);

  const { data: department, isLoading: loadingDept } = useGetDepartment(deptId, {
    query: { enabled: !!deptId, queryKey: getGetDepartmentQueryKey(deptId) }
  });

  const { data: staff, isLoading: loadingStaff } = useGetDepartmentStaff(deptId, {
    query: { enabled: !!deptId, queryKey: getGetDepartmentStaffQueryKey(deptId) }
  });

  if (loadingDept) {
    return <div className="p-8 text-center text-muted-foreground">Loading department...</div>;
  }

  if (!department) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Department not found</h2>
        <Button asChild className="mt-4"><Link href="/departments">Back to Departments</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-department-detail">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/departments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
          <p className="text-muted-foreground mt-1">Department Roster & Overview</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Assigned Personnel
          </CardTitle>
          <CardDescription>All staff members currently assigned to this division.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-t">
                <tr>
                  <th className="px-6 py-4 font-medium">Staff Member</th>
                  <th className="px-6 py-4 font-medium">Roles</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingStaff ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Loading staff roster...</td></tr>
                ) : !staff?.length ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No staff currently assigned to this department.</td></tr>
                ) : (
                  staff.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? user.roles.map(role => (
                            <span key={role.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-muted/50 text-muted-foreground uppercase tracking-wider">
                              {role.name}
                            </span>
                          )) : (
                            <span className="text-xs text-muted-foreground italic">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/staff/${user.id}`}>View Profile</Link>
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
    </div>
  );
}
