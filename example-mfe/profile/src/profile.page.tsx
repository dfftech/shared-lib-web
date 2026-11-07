// profile.page.tsx — page layout only: HeadLayout (Edit) + ContentLayout with the profile, edit form in a TypeDrawer.
import {
  ContentLayout,
  HeadLayout,
  TypeButton,
  TypeDrawer,
  TypeImage,
  TypeInput,
  TypeSelect,
  TypeTextArea,
  readOptionLabel,
  useUi,
} from "shared-lib-web";
import { ConstKeys, RegExp, type OptionType } from "dff-util";
import { useForm } from "react-hook-form";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";
// Imported images: built into profile.js, so they load from the MFE and not from the shell.
import photoSmallUrl from "./media/photo-3-small.jpg";
import photoUrl from "./media/photo-3.jpg";
import {
  PROFILE_FORM_ID,
  closeProfileEdit,
  handleProfileSave,
  isProfileEditOpen,
  openProfileEdit,
  profileSignal,
  type ProfileType,
} from "./profile.service.ts";

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


interface ProfileRowProps {
  label: string;
  value: string;
}

function ProfileRow(props: ProfileRowProps) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-base-300/70 py-2 last:border-b-0">
      <dt className="text-xs opacity-60">{props.label}</dt>
      <dd className="font-medium">{props.value}</dd>
    </div>
  );
}

/** The role label in the current language. */
function readRoleLabel(roleKey: string, languageCode: string): string {
  for (const option of roleOptions) {
    if (option.key === roleKey) {
      return readOptionLabel(option, languageCode);
    }
  }
  return roleKey;
}

/** Edit form inside the drawer (a new form each time the drawer opens, filled with the current profile). */
function ProfileForm() {
  const { t } = useUi();
  const formOptions = { defaultValues: profileSignal.value };
  const form = useForm<ProfileType>(formOptions);
  const onSubmit = form.handleSubmit(handleProfileSave);
  const control = form.control;

  return (
    <form id={PROFILE_FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-1">
      <TypeInput control={control} name="name" label={t("profile.name")} rules={requiredRule} />
      <TypeInput control={control} name="email" type="email" label={t("profile.email")} rules={emailRules} />
      <TypeInput control={control} name="phone" label={t("profile.phone")} />
      <TypeSelect control={control} name="role" label={t("profile.role")} options={roleOptions} rules={requiredRule} />
      <TypeInput control={control} name="location" label={t("profile.location")} />
      <TypeTextArea control={control} name="about" label={t("profile.about")} />
      <div className="mt-2 flex justify-end gap-2">
        <TypeButton action="ghost" label={t("profile.cancel")} onPress={closeProfileEdit} />
        <TypeButton type="submit" icon="Save" label={t("profile.save")} />
      </div>
    </form>
  );
}

function ProfilePage() {
  const { t, locale } = useUi();
  const profile = profileSignal.value;
  const isEditOpen = isProfileEditOpen.value;
  const roleLabel = readRoleLabel(profile.role, locale);
  const headActions = <TypeButton icon="Pencil" label={t("profile.edit")} onPress={openProfileEdit} />;

  return (
    <>
      <HeadLayout title={t("profile.title")} actions={headActions} />
      <ContentLayout>
        <div className="flex flex-col gap-6 md:flex-row">
          <TypeImage
            src={photoUrl}
            previewSrc={photoSmallUrl}
            alt={t("profile.photo")}
            className="rounded-full"
            width={128}
            height={128}
          />
          <dl className="grid flex-1 grid-cols-1 gap-x-8 md:grid-cols-2">
            <ProfileRow label={t("profile.name")} value={profile.name} />
            <ProfileRow label={t("profile.email")} value={profile.email} />
            <ProfileRow label={t("profile.phone")} value={profile.phone} />
            <ProfileRow label={t("profile.role")} value={roleLabel} />
            <ProfileRow label={t("profile.location")} value={profile.location} />
            <ProfileRow label={t("profile.about")} value={profile.about} />
          </dl>
        </div>
      </ContentLayout>
      <TypeDrawer isOpen={isEditOpen} side="end" size="md" title={t("profile.edit")} onClose={closeProfileEdit}>
        {isEditOpen ? <ProfileForm /> : null}
      </TypeDrawer>
    </>
  );
}

/** Root component of the profile MFE. */
export function ProfileMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  return (
    <MfePage isInShell={isInShell}>
      <ProfilePage />
    </MfePage>
  );
}
