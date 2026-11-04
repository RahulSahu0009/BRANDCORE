-- BRANDCORE D1 POC migration
-- Creates a minimal poc_records table to verify the D1 binding works.
-- This table is for POC verification only and will be dropped in a later migration.

CREATE TABLE IF NOT EXISTS poc_records (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);
