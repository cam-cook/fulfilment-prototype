-- Metabase database 2 (Cookaborough, MySQL). Replace :cook_id. Times in the DB are UTC.

-- Q1 Active check: paid orders a week over the last 12 full weeks
SELECT cook_id, ROUND(COUNT(*)/12,1) orders_per_week
FROM orders
WHERE status='paid' AND cook_id=:cook_id
  AND placed_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
GROUP BY cook_id;

-- Q2 Reference menu: the most recent menu that has opened, with any windows
SELECT mn.id, mn.name, cp.timezone,
  CONVERT_TZ(mn.start_date,'UTC',cp.timezone) opens_local,
  CONVERT_TZ(mn.cutoff_date,'UTC',cp.timezone) closes_local
FROM menus mn JOIN cook_profiles cp ON cp.id=mn.cook_id
WHERE mn.cook_id=:cook_id AND mn.start_date < NOW() AND IFNULL(mn.is_old,0)=0
  AND (EXISTS (SELECT 1 FROM menu_delivery_windows w WHERE w.menu_id=mn.id AND w.deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM menu_pickup_addresses p WHERE p.menu_id=mn.id AND p.deleted_at IS NULL))
ORDER BY mn.start_date DESC LIMIT 1;

-- Q3 Legacy windows on the reference menu (replace :menu_id and :tz)
SELECT 'delivery' type, w.zone_id loc_id, z.name loc_name,
  CONVERT_TZ(w.delivery_from,'UTC',:tz) from_local, CONVERT_TZ(w.delivery_to,'UTC',:tz) to_local,
  CONVERT_TZ(w.order_cutoff,'UTC',:tz) cutoff_local, w.max_orders, 0 private
FROM menu_delivery_windows w JOIN delivery_zones z ON z.id=w.zone_id
WHERE w.menu_id=:menu_id AND w.deleted_at IS NULL
UNION ALL
SELECT 'pickup', p.address_id, a.name,
  CONVERT_TZ(p.from_date,'UTC',:tz), CONVERT_TZ(p.to_date,'UTC',:tz),
  CONVERT_TZ(p.stop_ordering_at,'UTC',:tz), p.max_orders, IFNULL(p.private,0)
FROM menu_pickup_addresses p JOIN cook_pickup_addresses a ON a.id=p.address_id
WHERE p.menu_id=:menu_id AND p.deleted_at IS NULL
ORDER BY type, loc_name, from_local;

-- Q4 Derived schedules: the most common pattern per location, weekday and time window across the last 8 menus
WITH m AS (
  SELECT mn.id, cp.timezone tz FROM menus mn JOIN cook_profiles cp ON cp.id=mn.cook_id
  WHERE mn.cook_id=:cook_id AND mn.start_date < NOW() AND IFNULL(mn.is_old,0)=0
  ORDER BY mn.start_date DESC LIMIT 8
),
win AS (
  SELECT 'delivery' type, w.zone_id loc_id,
    CONVERT_TZ(w.delivery_from,'UTC',m.tz) f, CONVERT_TZ(w.delivery_to,'UTC',m.tz) t,
    CONVERT_TZ(w.order_cutoff,'UTC',m.tz) c, w.max_orders mx
  FROM menu_delivery_windows w JOIN m ON m.id=w.menu_id WHERE w.deleted_at IS NULL
  UNION ALL
  SELECT 'pickup', p.address_id,
    CONVERT_TZ(p.from_date,'UTC',m.tz), CONVERT_TZ(p.to_date,'UTC',m.tz),
    CONVERT_TZ(p.stop_ordering_at,'UTC',m.tz), p.max_orders
  FROM menu_pickup_addresses p JOIN m ON m.id=p.menu_id WHERE p.deleted_at IS NULL
),
pat AS (
  SELECT type, loc_id, LOWER(DAYNAME(f)) weekday, TIME_FORMAT(f,'%H:%i') start_t, TIME_FORMAT(t,'%H:%i') end_t,
    DATEDIFF(DATE(f), DATE(c)) days_before, TIME_FORMAT(c,'%H:%i') cutoff_t, mx, COUNT(*) n
  FROM win GROUP BY type, loc_id, weekday, start_t, end_t, days_before, cutoff_t, mx
),
ranked AS (
  SELECT pat.*, ROW_NUMBER() OVER (PARTITION BY type, loc_id, weekday, start_t, end_t ORDER BY n DESC) rk
  FROM pat
)
SELECT type, loc_id, weekday, start_t, end_t, days_before, cutoff_t, mx max_orders, n occurrences
FROM ranked WHERE rk=1
ORDER BY type, loc_id, FIELD(weekday,'monday','tuesday','wednesday','thursday','friday','saturday','sunday'), start_t;
-- Group the rows by type and loc_id into one schedule per location. Merge weekdays that share the same
-- windows and deadline into one schedule's days[]. If a location has patterns with different deadlines
-- on different weekdays, create one schedule per deadline.
-- Drop any pattern seen fewer than 2 times. One-offs aren't part of the schedule, and they show up in
-- Comparison as Missing, which is the point.
