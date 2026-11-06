// forms.page.tsx — page layout only: sticky HeadLayout (Cancel / Submit) + ContentLayout with the form.
import { ContentLayout, HeadLayout, TypeButton, TypeDate, TypeInput, TypeSelect, TypeSwitch, TypeTextArea, useUi } from "shared-lib-web";
import { useForm } from "react-hook-form";
import type { MfeProps } from "../../shared/mfe-lifecycles.ts";
import { MfePage } from "../../shared/mfe-page.tsx";
import { emailRules, requiredRule, roleOptions } from "../../shared/roles.ts";
import {
  FORMS_FORM_ID,
  getDefaultContact,
  handleContactCancel,
  handleContactSubmit,
  setContactReset,
  submittedContactSignal,
  type ContactFormType,
} from "./forms.service.ts";

function FormsPage() {
  const { t } = useUi();
  const defaultValues = getDefaultContact();
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<ContactFormType>(formOptions);
  setContactReset(form.reset);
  const onSubmit = form.handleSubmit(handleContactSubmit);
  const submitted = submittedContactSignal.value;
  const submittedJson = submitted ? JSON.stringify(submitted, null, 2) : "";
  const control = form.control;
  const headActions = (
    <>
      <TypeButton action="ghost" icon="X" label={t("mfe.forms.cancel")} onPress={handleContactCancel} />
      <TypeButton type="submit" form={FORMS_FORM_ID} icon="Send" label={t("mfe.forms.submit")} />
    </>
  );

  return (
    <>
      <HeadLayout title={t("mfe.forms.title")} actions={headActions} />
      <form id={FORMS_FORM_ID} onSubmit={onSubmit} noValidate>
        <ContentLayout>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <TypeInput control={control} name="name" label={t("mfe.forms.name")} rules={requiredRule} />
            <TypeInput control={control} name="email" type="email" label={t("mfe.forms.email")} rules={emailRules} />
            <TypeSelect control={control} name="role" label={t("mfe.forms.role")} options={roleOptions} rules={requiredRule} />
            <TypeDate control={control} name="startDate" label={t("mfe.forms.startDate")} />
          </div>
          <TypeSwitch control={control} name="isActive" label={t("mfe.forms.active")} />
          <TypeTextArea control={control} name="notes" label={t("mfe.forms.notes")} />
        </ContentLayout>
      </form>
      {submittedJson ? (
        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("mfe.forms.values")}</h3>
          <pre className="overflow-x-auto rounded-box bg-base-200 p-4 text-xs" dir="ltr">
            {submittedJson}
          </pre>
        </ContentLayout>
      ) : null}
    </>
  );
}

/** Root component of the forms MFE. */
export function FormsMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  return (
    <MfePage isInShell={isInShell}>
      <FormsPage />
    </MfePage>
  );
}
