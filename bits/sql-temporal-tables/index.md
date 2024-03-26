---
title: SQL Temporal Tables
slug: sql-temporal-tables
date: 2024-03-26
tags: sql, entity-framework
---

# SQL Temporal Tables

SQL Temporal Tables is a feature that allows you to keep a history of changes to a table without an effort.
By enabling `SYSTEM_VERSIONING` on a table, SQL Server creates a history table and keeps track of changes to the table.
This is useful for auditing purposes, or for tracking changes to data over time.

```sql{4-6
CREATE TABLE dbo.Person (
  [Id] UNIQUEIDENTIFIER NOT NULL,
  [Name] NVARCHAR(100) NOT NULL,
  [ValidFrom] DATETIME2 GENERATED ALWAYS AS ROW START,
  [ValidTo] DATETIME2 GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME(ValidFrom, ValidTo),
  CONSTRAINT [PK_Person] PRIMARY KEY CLUSTERED (Id)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.PersonHistory));
```

> Temporal tables (also known as system-versioned temporal tables) are a database feature that brings built-in support for providing information about data stored in the table at any point in time, rather than only the data that is correct at the current moment in time.
> Because it keeps a full history of data changes, it allows for easy point-in-time analysis.
>
> This is useful for:
>
> - Auditing all data changes and performing data forensics when necessary
> - Reconstructing state of the data as of any time in the past
> - Recovering from accidental data changes and application errors
> - Insights to data trends
>
> For more info see the [documentation](https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables).

Temporal tables are supported by Entity Framework, as I've mentioned in my blog post [Entity framework features I wish I knew earlier](../../blog/entity-framework-features-i-wish-i-knew-earlier/index.md).
