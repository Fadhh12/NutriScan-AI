-- SRS 2.3: foto scan tidak disimpan permanen lebih dari 30 hari, hanya hasil
-- analisis/teks yang persist. image_url jadi nullable supaya job retensi bisa
-- mengosongkannya tanpa menghapus baris scan itu sendiri.

alter table scans alter column image_url drop not null;

create index if not exists idx_scans_created_at on scans(created_at);
