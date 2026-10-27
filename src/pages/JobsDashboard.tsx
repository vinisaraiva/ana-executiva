/**
 * @fileoverview Dashboard de Jobs - DrGeFin
 * 
 * Painel de monitoramento de jobs de processamento em tempo real,
 * exibindo status, estatísticas, histórico e permitindo ações
 * como retry de jobs falhos e cancelamento de jobs na fila.
 * 
 * @author DrGeFin Team
 * @since 1.0.0
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Loader2, Clock, Play, CheckCircle2, XCircle, RefreshCw, RotateCcw, Ban } from "lucide-react";
import { format, subDays, startOfDay, startOfHour, eachDayOfInterval, eachHourOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

/** Tipo de status de job do banco de dados */
type JobStatus = Database["public"]["Enums"]["job_status"];
type Job = Database["public"]["Tables"]["jobs"]["Row"];

const statusConfig: Record<JobStatus, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Na fila", icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  processing: { label: "Processando", icon: <Play className="h-4 w-4" />, variant: "default" },
  done: { label: "Concluído", icon: <CheckCircle2 className="h-4 w-4" />, variant: "outline" },
  failed: { label: "Falhou", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
};

const chartConfig = {
  done: { label: "Concluídos", color: "hsl(var(--chart-2))" },
  failed: { label: "Falhados", color: "hsl(var(--chart-1))" },
};

type ChartPeriod = "24h" | "7d";

export default function JobsDashboard() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("24h");
  const [counts, setCounts] = useState<Record<JobStatus, number>>({
    queued: 0,
    processing: 0,
    done: 0,
    failed: 0,
  });
  const queryClient = useQueryClient();

  // Fetch jobs with optional filter
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["jobs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Job[];
    },
  });

  // Fetch all jobs for counts and chart
  const { data: allJobs, refetch: refetchAll } = useQuery({
    queryKey: ["jobs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("status, created_at, updated_at");
      if (error) throw error;
      return data;
    },
  });

  // Calculate counts when allJobs changes
  useEffect(() => {
    if (allJobs) {
      const newCounts: Record<JobStatus, number> = {
        queued: 0,
        processing: 0,
        done: 0,
        failed: 0,
      };
      allJobs.forEach((job) => {
        newCounts[job.status as JobStatus]++;
      });
      setCounts(newCounts);
    }
  }, [allJobs]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!allJobs) return [];

    const now = new Date();
    const isHourly = chartPeriod === "24h";
    
    if (isHourly) {
      const intervals = eachHourOfInterval({
        start: subDays(now, 1),
        end: now,
      });

      return intervals.map((hour) => {
        const hourStart = startOfHour(hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

        const done = allJobs.filter(
          (job) =>
            job.status === "done" &&
            new Date(job.updated_at) >= hourStart &&
            new Date(job.updated_at) < hourEnd
        ).length;

        const failed = allJobs.filter(
          (job) =>
            job.status === "failed" &&
            new Date(job.updated_at) >= hourStart &&
            new Date(job.updated_at) < hourEnd
        ).length;

        return {
          period: format(hour, "HH:mm"),
          done,
          failed,
        };
      });
    } else {
      const intervals = eachDayOfInterval({
        start: subDays(now, 7),
        end: now,
      });

      return intervals.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const done = allJobs.filter(
          (job) =>
            job.status === "done" &&
            new Date(job.updated_at) >= dayStart &&
            new Date(job.updated_at) < dayEnd
        ).length;

        const failed = allJobs.filter(
          (job) =>
            job.status === "failed" &&
            new Date(job.updated_at) >= dayStart &&
            new Date(job.updated_at) < dayEnd
        ).length;

        return {
          period: format(day, "dd/MM", { locale: ptBR }),
          done,
          failed,
        };
      });
    }
  }, [allJobs, chartPeriod]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => {
          refetch();
          refetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchAll]);

  // Retry a failed job
  const handleRetry = async (job: Job) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "queued",
          attempts: 0,
          last_error: null,
          locked_at: null,
          locked_by: null,
          available_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;
      toast.success("Job recolocado na fila");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Error retrying job:", error);
      toast.error("Erro ao retentar job");
    }
  };

  // Cancel a queued job
  const handleCancel = async (job: Job) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "failed",
          last_error: "Cancelado pelo administrador",
        })
        .eq("id", job.id);

      if (error) throw error;
      toast.success("Job cancelado");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Error canceling job:", error);
      toast.error("Erro ao cancelar job");
    }
  };

  const totalJobs = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <AppLayout title="Monitoramento de Jobs">
      <div className="space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(statusConfig) as JobStatus[]).map((status) => {
            const config = statusConfig[status];
            const count = counts[status];
            const isActive = statusFilter === status;

            return (
              <Card
                key={status}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setStatusFilter(isActive ? "all" : status)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  {config.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalJobs > 0 ? `${((count / totalJobs) * 100).toFixed(1)}%` : "0%"} do total
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Processamento</CardTitle>
            <Select
              value={chartPeriod}
              onValueChange={(value) => setChartPeriod(value as ChartPeriod)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData}>
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="done" fill="var(--color-done)" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" fill="var(--color-failed)" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Filters and Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Jobs</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as JobStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {(Object.keys(statusConfig) as JobStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Último erro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const config = statusConfig[job.status];
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.type}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.attempts}/{job.max_attempts}
                        </TableCell>
                        <TableCell>
                          {format(new Date(job.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-destructive">
                          {job.last_error || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(job)}
                              title="Retentar"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === "queued" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(job)}
                              title="Cancelar"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum job encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
