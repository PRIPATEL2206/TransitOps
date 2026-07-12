export const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Bus" },
  { value: "truck", label: "Truck" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "minibus", label: "Minibus" },
  { value: "pickup", label: "Pickup" },
] as const;

export const VEHICLE_STATUSES = [
  { value: "available", label: "Available", color: "green" },
  { value: "in_use", label: "In Use", color: "blue" },
  { value: "maintenance", label: "Maintenance", color: "orange" },
  { value: "retired", label: "Retired", color: "gray" },
] as const;

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
] as const;

export const DRIVER_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
  { value: "on_leave", label: "On Leave", color: "yellow" },
  { value: "suspended", label: "Suspended", color: "red" },
] as const;

export const LICENSE_TYPES = [
  { value: "A", label: "Class A - Motorcycle" },
  { value: "B", label: "Class B - Light Vehicle" },
  { value: "C", label: "Class C - Heavy Vehicle" },
  { value: "D", label: "Class D - Bus/Passenger" },
  { value: "E", label: "Class E - Large Truck" },
] as const;

export const TRIP_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "dispatched", label: "Dispatched", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "purple" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
] as const;

export const MAINTENANCE_TYPES = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire_rotation", label: "Tire Rotation" },
  { value: "brake_service", label: "Brake Service" },
  { value: "engine_service", label: "Engine Service" },
  { value: "transmission_service", label: "Transmission Service" },
  { value: "electrical", label: "Electrical" },
  { value: "body_repair", label: "Body Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
] as const;

export const MAINTENANCE_STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "yellow" },
  { value: "in_progress", label: "In Progress", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "fuel", label: "Fuel" },
  { value: "maintenance", label: "Maintenance" },
  { value: "insurance", label: "Insurance" },
  { value: "road_tax", label: "Road Tax" },
  { value: "tolls", label: "Tolls" },
  { value: "parking", label: "Parking" },
  { value: "driver_allowance", label: "Driver Allowance" },
  { value: "repair", label: "Repair" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_payment", label: "Mobile Payment" },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
