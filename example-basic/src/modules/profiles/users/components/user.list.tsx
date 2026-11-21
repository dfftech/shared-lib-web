// user.list.tsx — view only.
import { FloatLayout, HeadLayout, TypeButton, TypeDataView, TypeFilter, TypeSearch } from 'shared-lib-web';
import { useUserList } from "./user.list.ts";

export function UserList() {
  const { titleText, searchProps, roleFilterProps, reloadProps, addProps, dataViewProps } = useUserList();
  const headerActions = (
    <>
      <TypeSearch {...searchProps} />
      <TypeFilter {...roleFilterProps} />
      <TypeButton {...reloadProps} />
    </>
  );
  return (
    <div className="flex flex-col">
      <HeadLayout title={titleText} actions={headerActions} isBelowHeader={false} />
      <div className="mt-4">
        <TypeDataView {...dataViewProps} />
      </div>
      <FloatLayout>
        <TypeButton {...addProps} />
      </FloatLayout>
    </div>
  );
}
