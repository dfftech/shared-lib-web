// profile.view.ts — TypeScript only: the rows of the profile, the photo and the Edit button props.
import { readOptionLabel, useUi, type TranslateFunction, type TypeButtonProps, type TypeImageProps } from "shared-lib-web";
import type { OptionType } from "dff-util";
import { openProfileEdit, selectedProfile } from "../hooks/service.ts";
import { roleOptions } from "../hooks/service-load.ts";
import type { ProfileRowType, ProfileType } from "../hooks/types.ts";

// The photos are built into profile.js (new URL + import.meta.url), so they load from the MFE and not from the shell.
const photoLocation = new URL("../../../media/photo-3.jpg", import.meta.url);
const photoSmallLocation = new URL("../../../media/photo-3-small.jpg", import.meta.url);

/** Size of the round profile photo (px). */
const PHOTO_SIZE = 128;

export interface ProfileViewModel {
  titleText: string;
  editProps: TypeButtonProps;
  photoProps: TypeImageProps;
  rows: ProfileRowType[];
}

/** The role label in the current language (the key when the role is not in the options). */
function readRoleLabel(options: OptionType[], roleKey: string, languageCode: string): string {
  for (const option of options) {
    if (option.key === roleKey) {
      return readOptionLabel(option, languageCode);
    }
  }
  return roleKey;
}

function buildRows(profile: ProfileType, roleLabel: string, t: TranslateFunction): ProfileRowType[] {
  return [
    { label: t("profile.name"), value: profile.name },
    { label: t("profile.email"), value: profile.email },
    { label: t("profile.phone"), value: profile.phone },
    { label: t("profile.role"), value: roleLabel },
    { label: t("profile.location"), value: profile.location },
    { label: t("profile.about"), value: profile.about },
  ];
}

function buildEditProps(t: TranslateFunction): TypeButtonProps {
  return { icon: "Pencil", label: t("profile.edit"), onPress: openProfileEdit };
}

function buildPhotoProps(t: TranslateFunction): TypeImageProps {
  return {
    src: photoLocation.href,
    previewSrc: photoSmallLocation.href,
    alt: t("profile.photo"),
    className: "rounded-full",
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  };
}

export function useProfileView(): ProfileViewModel {
  const { t, locale } = useUi();
  const profile = selectedProfile.value;
  const options = roleOptions.value;
  const roleLabel = readRoleLabel(options, profile.role, locale);
  return {
    titleText: t("profile.title"),
    editProps: buildEditProps(t),
    photoProps: buildPhotoProps(t),
    rows: buildRows(profile, roleLabel, t),
  };
}
