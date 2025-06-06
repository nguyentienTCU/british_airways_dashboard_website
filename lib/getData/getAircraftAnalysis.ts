import { getChartData } from "../csv-parser";
import { Review } from "../../type/Review";

export async function getAircraftAnalysis() {
	try {
		const reviews = (await getChartData("reviews.csv")) as Review[];
		return {
			aircraftManufacturersPercentage:
				getAircraftManufacturersPercentage(reviews),
			aircraftModels: getAircraftModels(reviews),
		};
	} catch (error) {
		console.error("Error in aircraft analysis:", error);
		throw error;
	}
}

function getAircraftManufacturersPercentage(reviews: Review[]) {
	const manufacturerCounts: { [key: string]: number } = {};
	const totalReviews = reviews.length;

	// Count reviews for each manufacturer
	reviews.forEach((review) => {
		const manufacturer = review.AIRCRAFT_MANUFACTURER;
		if (manufacturer) {
			manufacturerCounts[manufacturer] =
				(manufacturerCounts[manufacturer] || 0) + 1;
		} else {
			manufacturerCounts["Unknown"] = (manufacturerCounts["Unknown"] || 0) + 1;
		}
	});

	// Convert to array and sort by count
	const sortedManufacturers = Object.entries(manufacturerCounts)
		.map(([manufacturer, count]) => ({
			manufacturer,
			count,
			percentage: (count / totalReviews) * 100,
		}))
		.sort((a, b) => b.count - a.count);

	// Get top 5 manufacturers
	const topManufacturers = sortedManufacturers.slice(0, 5);

	// Check if "Unknown" is in top 5
	const hasUnknown = topManufacturers.some((m) => m.manufacturer === "Unknown");

	if (hasUnknown) {
		return topManufacturers;
	} else {
		// Replace the last manufacturer with "Unknown"
		const unknownCount = manufacturerCounts["Unknown"] || 0;
		const unknownPercentage = (unknownCount / totalReviews) * 100;
		console.log("unknownPercentage", unknownPercentage.toFixed(3));

		return [
			...topManufacturers.slice(0, 4),
			{
				manufacturer: "Unknown",
				count: unknownCount,
				percentage: unknownPercentage,
			},
		];
	}
}

function getAircraftModels(reviews: Review[]) {
	const modelCounts: { [key: string]: number } = {};

	// Count reviews for each model
	reviews.forEach((review) => {
		const model = review.AIRCRAFT_MODEL;
		modelCounts[model] = (modelCounts[model] || 0) + 1;
	});

	// Convert to array, sort by count, and take top 6
	return Object.entries(modelCounts)
		.map(([model, count]) => ({
			model,
			count,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);
}