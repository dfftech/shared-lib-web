// forms.page.tsx — page layout only: sticky HeadLayout (Cancel / Submit) + ContentLayout with the form.
import { ContentLayout, HeadLayout, TypeButton, TypeDate, TypeInput, TypeSelect, TypeSwitch, TypeTextArea, useUi } from "shared-lib-web";
import { ConstKeys, RegExp, type OptionType } from "dff-util";
import { useForm } from "react-hook-form";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";
import {
  FORMS_FORM_ID,
  getDefaultContact,
  handleContactCancel,
  handleContactSubmit,
  setContactReset,
  submittedContactSignal,
  type ContactFormType,
} from "./forms.service.ts";

/** Role options of the select (labels per language code). */
const roleOptions: OptionType[] = [
  { key: "admin", label: "Admin", lang: { "fr-FR": "Administrateur", "ar-SA": "مسؤول", "te-IN": "నిర్వాహకుడు" } },
  { key: "editor", label: "Editor", lang: { "fr-FR": "Éditeur", "ar-SA": "محرر", "te-IN": "ఎడిటర్" } },
  { key: "viewer", label: "Viewer", lang: { "fr-FR": "Lecteur", "ar-SA": "مشاهد", "te-IN": "వీక్షకుడు" } },
];

/** Validation rules (dff-util ConstKeys messages, translated in root.json). */
const requiredRule = { required: { value: true, message: ConstKeys.REQUIRED } };
const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};


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
      <TypeButton action="ghost" icon="X" label={t("forms.cancel")} onPress={handleContactCancel} />
      <TypeButton type="submit" form={FORMS_FORM_ID} icon="Send" label={t("forms.submit")} />
    </>
  );

  return (
    <>
      <HeadLayout title={t("forms.title")} actions={headActions} />
      <form id={FORMS_FORM_ID} onSubmit={onSubmit} noValidate>
        <ContentLayout>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <TypeInput control={control} name="name" label={t("forms.name")} rules={requiredRule} />
            <TypeInput control={control} name="email" type="email" label={t("forms.email")} rules={emailRules} />
            <TypeSelect control={control} name="role" label={t("forms.role")} options={roleOptions} rules={requiredRule} />
            <TypeDate control={control} name="startDate" label={t("forms.startDate")} />
          </div>
          <TypeSwitch control={control} name="isActive" label={t("forms.active")} />
          <TypeTextArea control={control} name="notes" label={t("forms.notes")} />
        </ContentLayout>
      </form>
      {submittedJson ? (
        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("forms.values")}</h3>
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
