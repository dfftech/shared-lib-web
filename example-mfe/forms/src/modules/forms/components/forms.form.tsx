// forms.form.tsx — view only: sticky HeadLayout (Cancel / Submit) + the form, the submitted values and the OTP
// dialog (the "Verify" button next to the email opens it).
import { ContentLayout, HeadLayout, OtpModal, TypeButton, TypeDate, TypeInput, TypeSelect, TypeSwitch, TypeTextArea } from "shared-lib-web";
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
            <div className="flex items-end gap-2">
              <TypeInput {...model.emailProps} className="flex-1" />
              <TypeButton {...model.verifyEmailProps} className="mb-1" />
            </div>
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
      {model.verifiedOtpJson ? (
        <ContentLayout>
          <h3 className="mb-2 font-semibold">{model.verifiedTitle}</h3>
          <pre className="overflow-x-auto rounded-box bg-base-200 p-4 text-xs" dir="ltr">
            {model.verifiedOtpJson}
          </pre>
        </ContentLayout>
      ) : null}
      <OtpModal />
    </>
  );
}
