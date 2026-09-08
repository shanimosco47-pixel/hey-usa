-- 012_rename_denver_location_id.sql
-- The day-1 stop moved from Denver to Newark when United reissued HQ51BY (27/06/26)
-- and the location id in src/data/locations.ts was renamed 'denver' -> 'newark'.
-- Rows still tagged 'denver' (e.g. the scanned Staybridge Suites confirmation)
-- match no location and disappear from the locations hub, so remap them.

update documents set location_id = 'newark' where location_id = 'denver';
update location_notes set location_id = 'newark' where location_id = 'denver';
