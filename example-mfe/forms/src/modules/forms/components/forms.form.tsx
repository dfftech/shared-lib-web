// forms.form.tsx — view only: sticky HeadLayout (Cancel / Submit) + the form, and the submitted values.
import { ContentLayout, HeadLayout, TypeButton, TypeDate, TypeInput, TypeSelect, TypeSwitch, TypeTextArea } from "shared-lib-web";
import { useFormsForm } from "./forms.form.ts";

export function FormsForm() {
  const model = useFormsForm();
  const headActions = (
    <>
      <TypeButton {...model.cancelProps} />
      <TypeButton {...model.submitProps} />
    </>
  );
  return (
    <>
      <HeadLayout title={model.titleText} actions={headActions} />
      <form id={model.formId} onSubmit={model.onSubmit} noValidate>
        <ContentLayout>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <TypeInput {...model.nameProps} />
            <TypeInput {...model.emailProps} />
            <TypeSelect {...model.roleProps} />
            <TypeDate {...model.startDateProps} />
          </div>
          <TypeSwitch {...model.activeProps} />
          <TypeTextArea {...model.notesProps} />
        </ContentLayout>
      </form>
      {model.submittedJson ? (
        <ContentLayout>
          <h3 className="mb-2 font-semibold">{model.valuesTitle}</h3>
          <pre className="overflow-x-auto rounded-box bg-base-200 p-4 text-xs" dir="ltr">
            {model.submittedJson}
          </pre>
        </ContentLayout>
      ) : null}
    </>
  );
}
