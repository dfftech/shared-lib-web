// data-view.page.tsx - DataView examples for the basic example app.
import type { ColumnDef } from "@tanstack/react-table";
import { ArticleLayout, ContentLayout, TypeDataView } from "shared-lib-web";

interface DataViewRow {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number;
}

const dataViewRows: DataViewRow[] = [
  { id: "1", name: "Asha Rao", email: "asha@example.com", role: "admin", age: 34 },
  { id: "2", name: "Lucas Martin", email: "lucas@example.com", role: "editor", age: 29 },
  { id: "3", name: "Lena Becker", email: "lena@example.com", role: "viewer", age: 41 },
  { id: "4", name: "Omar Haddad", email: "omar@example.com", role: "editor", age: 37 },
];

const dataViewColumns: ColumnDef<DataViewRow>[] = [
  { accessorKey: "name", header: "Name", size: 240 },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "age", header: "Age", meta: { className: "text-right" } },
];

export function readDataViewRowId(row: DataViewRow): string {
  return row.id;
}

export function DataViewPage() {
  return (
    <div className="flex flex-col gap-4">
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">Data view</h2>
        <p className="opacity-70">Table, list and card layouts.</p>
      </ArticleLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">Rows</h3>
        <TypeDataView data={dataViewRows} columns={dataViewColumns} rendering="client" initialState={{ sorting: [] }} height={360} />
      </ContentLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">List</h3>
        <TypeDataView layout="list" data={dataViewRows} columns={dataViewColumns} getRowId={readDataViewRowId} height={300} />
      </ContentLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">Grid vertical</h3>
        <TypeDataView layout="grid-row" lanes={2} estimateSize={220} height={440} data={dataViewRows} columns={dataViewColumns} />
      </ContentLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">Columns</h3>
        <TypeDataView layout="grid-column" estimateSize={280} height={260} data={dataViewRows} columns={dataViewColumns} />
      </ContentLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">Vertical masonry</h3>
        <TypeDataView layout="masonry-row" lanes={2} estimateSize={220} height={440} data={dataViewRows} columns={dataViewColumns} />
      </ContentLayout>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">Horizontal masonry</h3>
        <TypeDataView layout="masonry-column" lanes={2} estimateSize={280} height={260} data={dataViewRows} columns={dataViewColumns} />
      </ContentLayout>
    </div>
  );
}
