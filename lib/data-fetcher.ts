import { executeQuery, connectToSnowflake } from "./snowflake";
import { uploadCSVToGCS } from "./gcs-utils";

export async function fetchAndSaveData() {
  try {
    // Fetch data from Snowflake
    console.log("check here");
    await connectToSnowflake();
    const data = await executeQuery(`
      SELECT \
    f.review_id AS review_id, \
    f.date_submitted_id AS review_date_id, \
    d.day_of_week_name AS review_day_of_week, \
    d.cal_mon_name AS review_month_name, \
    d.cal_month AS review_month_number, \
    d.cal_year AS review_year, \
    f.verified AS review_verified, \
    c.customer_name AS customer_name, \
    d.cal_mon_name AS flight_month_name, \
    d.cal_month AS flight_month_number, \
    d.cal_year AS flight_year, \
    CONCAT(d.cal_mon_name, '-', d.cal_year) AS flight_month_year, \
    c.nationality AS customer_country, \
    a.aircraft_model AS aircraft_model, \
    a.aircraft_manufacturer AS aircraft_manufacturer, \
    a.seat_capacity AS aircraft_seat_capacity, \
    f.seat_type AS review_seat_type, \
    ol.city AS origin_city, \
    ol.airport as origin_airport, \
    dl.city AS destination_city, \
    dl.airport AS destination_airport, \
    tl.city AS transit_city, \
    tl.airport AS transit_airport \
FROM british_airways_db.marts.fct_review f \
JOIN british_airways_db.marts.dim_date d ON f.date_submitted_id = d.date_id \
JOIN british_airways_db.marts.dim_customer c ON f.customer_id = c.customer_id \
JOIN british_airways_db.marts.dim_location ol ON f.origin_location_id = ol.location_id \
JOIN british_airways_db.marts.dim_location dl ON f.destination_location_id = dl.location_id \
JOIN british_airways_db.marts.dim_location tl ON f.transit_location_id = tl.location_id \
JOIN british_airways_db.marts.dim_aircraft a ON f.aircraft_id = a.aircraft_id \
WHERE f.date_submitted_id IS NOT NULL
    `);

    // Convert to CSV
    const csvContent = convertToCSV(data);

    // Upload to Google Cloud Storage with consistent filename
    const fileName = "reviews.csv"; // Consistent filename for weekly overwrite
    const publicUrl = await uploadCSVToGCS(csvContent, fileName);

    return {
      success: true,
      message: "Data saved successfully",
      fileUrl: publicUrl,
    };
  } catch (error) {
    console.error("Error fetching and saving data:", error);
    throw error;
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(",")
    ),
  ];

  return csvRows.join("\n");
}
