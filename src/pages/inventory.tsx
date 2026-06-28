import { PageHeader } from "@/components/layout/page-header";
import { InventoryTable } from "@/components/inventory-table";
import { useScopedRows } from "@/hooks/use-auth";

export function InventoryPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Every line item in your scope. Switch between cost and reliability views, then search, filter, and sort."
      />
      <InventoryTable data={rows} />
    </>
  );
}
