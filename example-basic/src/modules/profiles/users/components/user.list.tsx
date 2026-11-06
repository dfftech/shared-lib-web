// user.list.tsx — view only.
import { ArticleLayout, FloatLayout, GridLayout, TypeButton, TypeFilter, TypeSearch, TypeTable } from "shared-lib-web";
import { useUserList } from "./user.list.ts";

export function UserList() {
  const { titleText, searchProps, roleFilterProps, reloadProps, addProps, tableProps } = useUserList();
  return (
    <>
      <ArticleLayout>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-primary">{titleText}</h2>
          <div className="flex items-center gap-2">
            <TypeSearch {...searchProps} />
            <TypeFilter {...roleFilterProps} />
            <TypeButton {...reloadProps} />
          </div>
        </div>
      </ArticleLayout>
      <GridLayout className="mt-4">
        <TypeTable {...tableProps} />
      </GridLayout>
      <FloatLayout>
        <TypeButton {...addProps} />
      </FloatLayout>
    </>
  );
}
