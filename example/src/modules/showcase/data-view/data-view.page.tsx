// data-view.page.tsx - virtualized table, list and card layouts.
import type { ColumnDef, Row, RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import { ArticleLayout, ContentLayout, EmptyState, TypeDataView } from 'shared-lib-web';

interface DataViewUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  age: number;
  active: boolean;
  overdue: boolean;
}

const dataViewUsers: DataViewUser[] = [
  { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'admin', age: 34, active: true, overdue: false },
  { id: 'u2', name: 'Lucas Martin', email: 'lucas@example.com', role: 'editor', age: 29, active: true, overdue: false },
  { id: 'u3', name: 'Lena Becker', email: 'lena@example.com', role: 'viewer', age: 41, active: false, overdue: true },
  { id: 'u4', name: 'Omar Haddad', email: 'omar@example.com', role: 'editor', age: 37, active: true, overdue: false },
  { id: 'u5', name: 'Mia Wilson', email: 'mia@example.com', role: 'viewer', age: 26, active: true, overdue: true },
  { id: 'u6', name: 'Noah Garcia', email: 'noah@example.com', role: 'admin', age: 45, active: false, overdue: false },
  { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'admin', age: 34, active: true, overdue: false },
  { id: 'u2', name: 'Lucas Martin', email: 'lucas@example.com', role: 'editor', age: 29, active: true, overdue: false },
  { id: 'u3', name: 'Lena Becker', email: 'lena@example.com', role: 'viewer', age: 41, active: false, overdue: true },
  { id: 'u4', name: 'Omar Haddad', email: 'omar@example.com', role: 'editor', age: 37, active: true, overdue: false },
  { id: 'u5', name: 'Mia Wilson', email: 'mia@example.com', role: 'viewer', age: 26, active: true, overdue: true },
  { id: 'u6', name: 'Noah Garcia', email: 'noah@example.com', role: 'admin', age: 45, active: false, overdue: false },
  { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'admin', age: 34, active: true, overdue: false },
  { id: 'u2', name: 'Lucas Martin', email: 'lucas@example.com', role: 'editor', age: 29, active: true, overdue: false },
  { id: 'u3', name: 'Lena Becker', email: 'lena@example.com', role: 'viewer', age: 41, active: false, overdue: true },
  { id: 'u4', name: 'Omar Haddad', email: 'omar@example.com', role: 'editor', age: 37, active: true, overdue: false },
  { id: 'u5', name: 'Mia Wilson', email: 'mia@example.com', role: 'viewer', age: 26, active: true, overdue: true },
  { id: 'u6', name: 'Noah Garcia', email: 'noah@example.com', role: 'admin', age: 45, active: false, overdue: false },
  { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'admin', age: 34, active: true, overdue: false },
  { id: 'u2', name: 'Lucas Martin', email: 'lucas@example.com', role: 'editor', age: 29, active: true, overdue: false },
  { id: 'u3', name: 'Lena Becker', email: 'lena@example.com', role: 'viewer', age: 41, active: false, overdue: true },
  { id: 'u4', name: 'Omar Haddad', email: 'omar@example.com', role: 'editor', age: 37, active: true, overdue: false },
  { id: 'u5', name: 'Mia Wilson', email: 'mia@example.com', role: 'viewer', age: 26, active: true, overdue: true },
];

const dataViewColumns: ColumnDef<DataViewUser>[] = [
  { accessorKey: 'name', header: 'Name', size: 240 },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', enableSorting: false },
  { accessorKey: 'age', header: 'Age', meta: { className: 'text-right' } },
];

export function readDataViewUserId(row: DataViewUser): string {
  return row.id;
}

export function readDataViewRowClass(row: DataViewUser): string {
  return row.overdue ? 'text-error' : '';
}

export function renderDataViewCard(row: DataViewUser): React.ReactNode {
  return (
    <div className="card card-border h-full border-base-300 bg-base-100">
      <div className="card-body">
        <h3 className="card-title text-base">{row.name}</h3>
        <p className="truncate text-sm opacity-70" title={row.email}>
          {row.email}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="badge badge-outline">{row.role}</span>
          <span className="whitespace-nowrap">{row.age} years</span>
        </div>
      </div>
    </div>
  );
}

export function renderDataViewListItem(row: DataViewUser, tableRow: Row<DataViewUser>): React.ReactNode {
  return (
    <>
      {tableRow.getIsSelected() ? <span className="badge badge-primary badge-sm">Selected</span> : null}
      <div className="list-col-grow">
        <div className="font-bold">{row.name}</div>
        <div className="text-xs opacity-60">{row.email}</div>
      </div>
      <span className="badge badge-outline">{row.role}</span>
      <span className="text-sm">{row.age}</span>
    </>
  );
}

export function DataViewPage() {
  const [selection, setSelection] = useState<RowSelectionState>({});

  return (
    <div className="flex flex-col gap-4">
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">Data view</h2>
        <p className="opacity-70">Virtualized table, card and list layouts with TanStack Table.</p>
      </ArticleLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">Table</h3>
        <TypeDataView
          data={dataViewUsers}
          columns={dataViewColumns}
          rendering="client"
          initialState={{ sorting: [] }}
          height={360}
          enableGlobalFilter
          enableColumnFilters
          enableColumnPinning
          enableColumnResizing
        />
      </ContentLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">Grid cards</h3>
        <TypeDataView
          layout="grid-row"
          lanes={3}
          estimateSize={220}
          height={480}
          data={dataViewUsers}
          columns={dataViewColumns}
          renderCard={renderDataViewCard}
          enableGlobalFilter
        />
      </ContentLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">Horizontal columns</h3>
        <TypeDataView
          layout="grid-column"
          estimateSize={280}
          height={260}
          data={dataViewUsers}
          columns={dataViewColumns}
          renderCard={renderDataViewCard}
          enableGlobalFilter
        />
      </ContentLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">Vertical masonry cards</h3>
        <TypeDataView
          layout="masonry-row"
          lanes={3}
          estimateSize={220}
          height={480}
          data={dataViewUsers}
          columns={dataViewColumns}
          renderCard={renderDataViewCard}
        />
      </ContentLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">Horizontal masonry cards</h3>
        <TypeDataView
          layout="masonry-column"
          lanes={2}
          estimateSize={280}
          height={260}
          data={dataViewUsers}
          columns={dataViewColumns}
          renderCard={renderDataViewCard}
        />
      </ContentLayout>

      <ContentLayout>
        <h3 className="mb-3 font-semibold">List with selection</h3>
        <TypeDataView
          layout="list"
          height={360}
          data={dataViewUsers}
          columns={dataViewColumns}
          getRowId={readDataViewUserId}
          enableRowSelection
          rowSelection={selection}
          onRowSelectionChange={setSelection}
          renderListItem={renderDataViewListItem}
          emptyMessage={<EmptyState />}
        />
      </ContentLayout>
    </div>
  );
}
