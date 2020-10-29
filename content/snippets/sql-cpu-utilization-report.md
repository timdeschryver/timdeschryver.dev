---
title: SQL CPU Utilization Report
slug: sql-cpu-utilization-report
image: snippets/images/sql-cpu-utilization-report.png
author: Tim Deschryver
date: 2020-10-29
tags: sql
---

## SQL CPU Utilization Report

This is my go-to script when there are SQL performance issues.
Sadly, I can't remember where I found it.

```sql
/*****	Script: Database Wise CPU Utilization report *****/
/*****	Output:
CPUPercent: Let's say this instance is using 50% CPU and one of the database is using 80%. It means the actual CPU usage from the database is calculated as: (80 / 100) * 50 = 40 %
*****/
WITH DB_CPU AS
(SELECT	DatabaseID,
		DB_Name(DatabaseID) AS [DatabaseName],
		SUM(total_worker_time) AS [CPU_Time(Ms)]
FROM	sys.dm_exec_query_stats AS qs
CROSS APPLY(SELECT	CONVERT(int, value)AS [DatabaseID]
			FROM	sys.dm_exec_plan_attributes(qs.plan_handle)
			WHERE	attribute =N'dbid')AS epa GROUP BY DatabaseID)
SELECT
	DatabaseName AS [DBName], [CPU_Time(Ms)],
	CAST([CPU_Time(Ms)] * 1.0 /SUM([CPU_Time(Ms)]) OVER()* 100.0 AS DECIMAL(5, 2))AS [CPUPercent]
FROM	DB_CPU
WHERE	DatabaseID > 4 -- system databases
	AND DatabaseID <> 32767 -- ResourceDB
ORDER BY CPUPercent desc
OPTION(RECOMPILE);

/*****	Script: Top 10 queries that causes high CPU Utilization *****/
/*****	Note: This script returns list of costly queries when CPU utilization is high enough from last 10 min ****/

SET NOCOUNT ON
DECLARE @cpu bigint = 50
DECLARE @ts_now bigint
DECLARE @AvgCPUUtilization DECIMAL(10,2)

SELECT @ts_now = cpu_ticks/(cpu_ticks/ms_ticks) FROM sys.dm_os_sys_info

SELECT TOP(10) SQLProcessUtilization AS [SQLServerProcessCPUUtilization]
,SystemIdle AS [SystemIdleProcess]
,100 - SystemIdle - SQLProcessUtilization AS [OtherProcessCPU Utilization]
,DATEADD(ms, -1 * (@ts_now - [timestamp]), GETDATE()) AS [EventTime]
INTO #CPUUtilization
FROM (
      SELECT record.value('(./Record/@id)[1]', 'int') AS record_id,
            record.value('(./Record/SchedulerMonitorEvent/SystemHealth/SystemIdle)[1]', 'int')
            AS [SystemIdle],
            record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]',
            'int')
            AS [SQLProcessUtilization], [timestamp]
      FROM (
            SELECT [timestamp], CONVERT(xml, record) AS [record]
            FROM sys.dm_os_ring_buffers
            WHERE ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
            AND record LIKE '%<SystemHealth>%') AS x
      ) AS y
ORDER BY record_id DESC

SELECT @AvgCPUUtilization = AVG([SQLServerProcessCPUUtilization] + [OtherProcessCPU Utilization])
FROM #CPUUtilization
WHERE EventTime > DATEADD(MM, -10, GETDATE())

IF @AvgCPUUtilization >= @cpu
BEGIN
	SELECT TOP(10)
		CONVERT(VARCHAR(25),@AvgCPUUtilization) +'%' AS [AvgCPUUtilization]
		, GETDATE() [Date and Time]
		, r.cpu_time
		, r.total_elapsed_time
		, s.session_id
		, s.login_name
		, s.host_name
		, DB_NAME(r.database_id) AS DatabaseName
		, SUBSTRING (t.text,(r.statement_start_offset/2) + 1,
		((CASE WHEN r.statement_end_offset = -1
			THEN LEN(CONVERT(NVARCHAR(MAX), t.text)) * 2
			ELSE r.statement_end_offset
		END - r.statement_start_offset)/2) + 1) AS [IndividualQuery]
		, SUBSTRING(text, 1, 200) AS [ParentQuery]
		, r.status
		, r.start_time
		, r.wait_type
		, s.program_name
	INTO #PossibleCPUUtilizationQueries
	FROM sys.dm_exec_sessions s
	INNER JOIN sys.dm_exec_connections c ON s.session_id = c.session_id
	INNER JOIN sys.dm_exec_requests r ON c.connection_id = r.connection_id
	CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
	WHERE s.session_id > 50
		AND r.session_id != @@spid
	order by r.cpu_time desc

	SELECT *
	FROM #PossibleCPUUtilizationQueries
END

IF OBJECT_ID('TEMPDB..#CPUUtilization') IS NOT NULL
drop table #CPUUtilization

IF OBJECT_ID('TEMPDB..#PossibleCPUUtilizationQueries') IS NOT NULL
drop table #PossibleCPUUtilizationQueries
```
