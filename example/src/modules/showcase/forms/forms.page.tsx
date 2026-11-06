// forms.page.tsx — every react-hook-form Type* control in one form (light/dark, LTR/RTL).
import {
  ContentLayout,
  HeadLayout,
  TypeButton,
  TypeCheckbox,
  TypeDate,
  TypeImage,
  TypeInput,
  TypeLang,
  TypeList,
  TypeOtp,
  TypeSelect,
  TypeSwitch,
  TypeTextArea,
  TypeTime,
  TypeUpload,
  TypeVideo,
  readLanguageOptions,
  readTelCodeOptions,
} from "shared-lib-web";
import { TypeLangMd, TypeMdv, TypeMdx } from "shared-lib-web/markdown";
import { showcasePlanOptions, showcaseRoleOptions, showcaseSkillOptions } from "./hooks/data.ts";
import { showcaseValidation } from "./hooks/validation.ts";
import { SHOWCASE_FORM_ID, useFormsPage } from "./forms.page.ts";

const telCodeOptions = readTelCodeOptions();
const languageOptions = readLanguageOptions();

export function FormsPage() {
  const { control, onSubmit, onCancel, submittedJson, submittedContent, submittedPageBody, t } = useFormsPage();
  // The header buttons sit outside the <form>: Submit finds it through form={SHOWCASE_FORM_ID}.
  const headActions = (
    <>
      <TypeButton action="ghost" icon="X" label={t("user.cancel")} onPress={onCancel} />
      <TypeButton type="submit" form={SHOWCASE_FORM_ID} icon="Send" label={t("demo.submit")} />
    </>
  );

  return (
    <>
      <HeadLayout title={t("nav.forms")} actions={headActions} />
      <form id={SHOWCASE_FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.basic")}</h3>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
            <TypeInput control={control} name="name" label={t("user.name")} rules={showcaseValidation.name} />
            <TypeInput control={control} name="email" type="email" label={t("user.email")} rules={showcaseValidation.email} />
            <TypeSelect control={control} name="role" label={t("user.role")} options={showcaseRoleOptions} rules={showcaseValidation.role} />
            <TypeSelect control={control} name="phoneCountry" label={t("demo.phoneCountry")} options={telCodeOptions} />
            <TypeSelect control={control} name="preferredLanguage" label={t("demo.preferredLanguage")} options={languageOptions} />
            <TypeDate control={control} name="startDate" label={t("demo.startDate")} rules={showcaseValidation.startDate} />
            <TypeDate control={control} name="meetingAt" label={t("demo.meetingAt")} isDateTime />
            <TypeTime control={control} name="openTime" label={t("demo.openTime")} />
            <TypeOtp control={control} name="code" label={t("demo.code")} rules={showcaseValidation.code} />
            <div className="flex flex-col justify-end">
              <TypeSwitch control={control} name="isActive" label={t("user.active")} />
              <TypeCheckbox control={control} name="acceptTerms" label={t("demo.acceptTerms")} rules={showcaseValidation.acceptTerms} />
            </div>
          </div>
          <TypeTextArea control={control} name="bio" label={t("demo.bio")} />
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.lists")}</h3>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <TypeList control={control} name="skills" label={t("demo.skills")} options={showcaseSkillOptions} rules={showcaseValidation.skills} />
            <TypeList control={control} name="plan" label={t("demo.plan")} options={showcasePlanOptions} selectionMode="single" />
          </div>
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.languages")}</h3>
          <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
            <TypeLang control={control} name="title" label={t("demo.title")} rules={showcaseValidation.title} />
            <TypeLang control={control} name="summary" label={t("demo.summary")} type="textarea" />
          </div>
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.uploads")}</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TypeUpload control={control} name="csvFile" label={t("demo.csvFile")} fileType="csv" maxSize="10MB" rules={showcaseValidation.csvFile} />
            <TypeUpload
              control={control}
              name="photos"
              label={t("demo.photos")}
              fileType={["png", "jpg", "jpeg", "webp"]}
              maxSize="5MB"
              isMultiple
              totalSize="20MB"
              icon="Images"
            />
          </div>
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.images")}</h3>
          <p className="mb-3 text-sm opacity-70">{t("demo.imagesText")}</p>
          <div className="flex flex-wrap items-end gap-4">
            <TypeImage src="/media/photo-1.jpg" previewSrc="/media/photo-1-small.jpg" alt={t("demo.photo1")} />
            <TypeImage src="/media/photo-2.jpg" previewSrc="/media/photo-2-small.jpg" alt={t("demo.photo2")} width={240} height={160} />
            <TypeImage src="/media/photo-1.jpg" previewSrc="/media/photo-1-small.jpg" alt={t("demo.photo1")} height={96} />
            <TypeImage src="/media/photo-3.jpg" alt={t("demo.photo3")} className="rounded-full" width={108} height={108} />
            <TypeImage src="/media/missing.jpg" alt={t("demo.brokenImage")} />
          </div>
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.videos")}</h3>
          <p className="mb-3 text-sm opacity-70">{t("demo.videosText")}</p>
          <div className="flex flex-wrap items-end gap-4">
            <TypeVideo src="/media/demo.mp4" poster="/media/demo-poster.jpg" title={t("demo.video")} />
            <TypeVideo src="/media/demo.mp4" title={t("demo.videoFirstFrame")} width={320} height={180} />
            <TypeVideo src="/media/demo.mp4" poster="/media/demo-poster.jpg" title={t("demo.video")} height={110} />
          </div>
        </ContentLayout>

        <ContentLayout>
          <h3 className="mb-2 font-semibold">{t("demo.markdown")}</h3>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TypeMdx control={control} name="content" label={t("demo.content")} height={260} />
            <div className="flex flex-col gap-2">
              <span className="fieldset-legend">{t("demo.preview")}</span>
              <TypeMdv text={submittedContent} className="border border-base-300 p-4" />
            </div>
          </div>
          <TypeLangMd control={control} name="pageBody" label={t("demo.pageBody")} height={180} />
          <TypeMdv textByLanguage={submittedPageBody} className="mt-2 border border-base-300 p-4" />
        </ContentLayout>

        {submittedJson ? (
          <ContentLayout>
            <h3 className="mb-2 font-semibold">{t("demo.submittedValues")}</h3>
            <pre className="overflow-x-auto rounded-box bg-base-200 p-4 text-xs" dir="ltr">
              {submittedJson}
            </pre>
          </ContentLayout>
        ) : null}
      </form>
    </>
  );
}
