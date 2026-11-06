// forms.page.ts — TypeScript only: react-hook-form set-up for every Type* control.
import { useUi } from "shared-lib-web";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { getDefaultShowcase } from "./hooks/data.ts";
import { handleShowcaseCancel, handleShowcaseSubmit, setShowcaseReset, showcaseSubmitted } from "./hooks/service.ts";
import type { ShowcaseFormType } from "./hooks/types.ts";

/** id of the <form>, so the Submit button in the HeadLayout (outside the form) can submit it. */
export const SHOWCASE_FORM_ID = "showcase-form";

export interface FormsPageModel {
  control: Control<ShowcaseFormType>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  submittedJson: string;
  submittedContent: string;
  submittedPageBody: Record<string, string>;
  t: (key: string) => string;
}

export function useFormsPage(): FormsPageModel {
  const { t } = useUi();
  const defaultValues = getDefaultShowcase();
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<ShowcaseFormType>(formOptions);
  const onSubmit = form.handleSubmit(handleShowcaseSubmit);
  setShowcaseReset(form.reset);
  const submitted = showcaseSubmitted.value;
  const submittedJson = submitted ? JSON.stringify(submitted, null, 2) : "";
  return {
    control: form.control,
    onSubmit: onSubmit,
    onCancel: handleShowcaseCancel,
    submittedJson: submittedJson,
    submittedContent: submitted?.content ?? defaultValues.content,
    submittedPageBody: submitted?.pageBody ?? defaultValues.pageBody,
    t: t,
  };
}
