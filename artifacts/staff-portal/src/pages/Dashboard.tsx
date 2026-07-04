import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDepartmentBreakdown, getGetDepartmentBreakdownQueryKey, useGetRoleBreakdown, getGetRoleBreakdownQueryKey, useGetRecentStaff, getGetRecentStaffQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Shield, UserCog } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: deptBreakdown, isLoading: loadingDept } = useGetDepartmentBreakdown({ query: { queryKey: getGetDepartmentBreakdownQueryKey() } });
  const { data: roleBreakdown, isLoading: loadingRole } = useGetRoleBreakdown({ query: { queryKey: getGetRoleBreakdownQueryKey() } });
  const { data: recentStaff, isLoading: loadingRecent } = useGetRecentStaff({ query: { queryKey: getGetRecentStaffQueryKey() } });

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-8" data-testid="page-dashboard" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          بەخێربێیت، {user?.full_name || user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-1">ئەمە لاپەڕەی داشبۆردی سەرەکییە — سیستەمی ئی-ڕێکار.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">کۆی فەرمانبەران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? "-" : summary?.total_staff}</div>
            <p className="text-xs text-muted-foreground mt-1">فەرمانبەری تۆمارکراو</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">هۆبەکان</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? "-" : summary?.total_departments}</div>
            <p className="text-xs text-muted-foreground mt-1">هۆبەی چالاک</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ڕۆڵەکان</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? "-" : summary?.total_roles}</div>
            <p className="text-xs text-muted-foreground mt-1">ئاستی دەسەڵات</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">بەڕێوەبەرانی گشتی</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? "-" : summary?.super_admin_count}</div>
            <p className="text-xs text-muted-foreground mt-1">دەسەڵاتی تەواوی سیستەم</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Department Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">فەرمانبەر بەپێی هۆبە</CardTitle>
            <CardDescription>دابەشبوونی فەرمانبەران لە نێوان هۆبەکاندا.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingDept ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">چاوەڕێ بکە...</div>
            ) : !deptBreakdown?.length ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">داتایەک نەدۆزرایەوە.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBreakdown} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department_name" tickLine={false} axisLine={false} fontSize={12} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: "var(--elevate-1)" }} contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontFamily: "'Noto Kufi Arabic', sans-serif" }} />
                  <Bar dataKey="staff_count" radius={[4, 4, 0, 0]}>
                    {deptBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Role Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">فەرمانبەر بەپێی ڕۆڵ</CardTitle>
            <CardDescription>دابەشبوونی ڕۆڵەکان لە نێوان فەرمانبەراندا.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingRole ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">چاوەڕێ بکە...</div>
            ) : !roleBreakdown?.length ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">داتایەک نەدۆزرایەوە.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleBreakdown} dataKey="staff_count" nameKey="role_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {roleBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontFamily: "'Noto Kufi Arabic', sans-serif" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Staff Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">فەرمانبەرانی نوێ</CardTitle>
            <CardDescription>کۆتا فەرمانبەرانی زیادکراو بۆ سیستەم.</CardDescription>
          </div>
          <Link href="/staff" className="text-sm text-primary font-medium hover:underline">بینینی هەمووی</Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-right">ناوی تەواو</th>
                  <th className="px-4 py-3 font-medium text-right">ناوی بەکارهێنەر</th>
                  <th className="px-4 py-3 font-medium text-right">هۆبە</th>
                  <th className="px-4 py-3 font-medium text-right">بەرواری زیادکردن</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecent ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">چاوەڕێ بکە...</td></tr>
                ) : !recentStaff?.length ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">هیچ فەرمانبەرێک نەدۆزرایەوە.</td></tr>
                ) : (
                  recentStaff.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground text-right">{staff.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-right">{staff.username}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                          {staff.department_name || "بێ هۆبە"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-right">
                        {format(new Date(staff.created_at), "MMM d, yyyy")}
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
