-- One confirmed scan produces at most one daily_logs row. Without this, a
-- retried or double-tapped PATCH /scan/:id/confirm creates a second log row
-- for the same scan and double-counts its calories in /logs and
-- /dashboard/summary. createDailyLog() now upserts on this constraint.

alter table daily_logs add constraint daily_logs_scan_id_key unique (scan_id);
