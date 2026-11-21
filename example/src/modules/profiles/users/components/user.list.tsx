// user.list.tsx — view only.
import { FloatLayout, HeadLayout, TypeButton, TypeDataView, TypeSearch } from 'shared-lib-web';
import { useUserList } from "./user.list.ts";

export function UserList() {
  const { titleText, searchProps, reloadProps, addProps, dataViewProps } = useUserList();
  const headerActions = (
    <div className="flex flex-row gap-2">
      <TypeSearch {...searchProps} />
      {/* <TypeFilter {...roleFilterProps} /> */}
      <TypeButton {...reloadProps} />
    </div>
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
