import type { DashboardData } from "@/lib/dashboard/types";
import { mapVendorStatusLabel } from "@/lib/dashboard/client-event-operational-kpis";
import type {
  ClientEventVendorsRpcPayload,
  ClientEventVendorsRpcVendorRow,
} from "@/lib/vendors/client-event-vendors-rpc";

/** Vendor KPIs shared by the vendors module and client dashboard. */
export type ClientEventDashboardVendorMetrics = {
  vendorCount: number;
  activeVendors: number;
  vendorSnapshot: DashboardData["vendorSnapshot"];
};

export function mapRpcPayloadToDashboardVendorMetrics(
  payload: ClientEventVendorsRpcPayload,
): ClientEventDashboardVendorMetrics {
  const latest = payload.vendors.slice(0, 5);

  return {
    vendorCount: payload.summary.vendorCount,
    activeVendors: payload.summary.activeVendors,
    vendorSnapshot: latest.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      service: vendor.service_category || "Fornecedor",
      status: mapVendorStatusLabel(vendor.status),
    })),
  };
}

export function mapRpcVendorRowToSnapshotItem(
  vendor: ClientEventVendorsRpcVendorRow,
): DashboardData["vendorSnapshot"][number] {
  return {
    id: vendor.id,
    name: vendor.name,
    service: vendor.service_category || "Fornecedor",
    status: mapVendorStatusLabel(vendor.status),
  };
}
