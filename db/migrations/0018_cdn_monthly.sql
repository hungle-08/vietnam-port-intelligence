CREATE VIEW cdn_monthly_arrival_stats AS
SELECT date_trunc('month',a.atb AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS arrival_month,
 count(*)::integer AS arrivals,
 count(v.dwt)::integer AS arrivals_with_dwt,
 sum(v.dwt) AS total_known_dwt,
 count(a.teu)::integer AS arrivals_with_teu,
 sum(a.teu) AS total_known_teu
FROM cdn_arrivals a LEFT JOIN cdn_vessels v ON v.id=a.vessel_id AND v.match_status='verified'
WHERE a.terminal='tien-sa' AND a.atb<=now()
GROUP BY 1;
