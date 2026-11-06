// overlays.page.tsx — TypeModal, TypeDrawer, TypeConfirm, TypeDropdown, TypeIcon buttons and toasts.
import {
  ArticleLayout,
  ContentLayout,
  TypeButton,
  TypeConfirm,
  TypeDrawer,
  TypeDropdown,
  TypeIcon,
  TypeModal,
  useUi,
} from "shared-lib-web";
import {
  actionItems,
  closeConfirm,
  closeDrawer,
  closeModal,
  drawerSide,
  handleActionSelect,
  handleConfirm,
  handleToastClick,
  isConfirmOpen,
  isModalOpen,
  lastAction,
  openConfirm,
  openDrawerEnd,
  openDrawerStart,
  openModal,
} from "./overlays.page.ts";

export function OverlaysPage() {
  const { t } = useUi();
  const side = drawerSide.value;
  const modalFooter = <TypeButton label={t("ui.close")} onPress={closeModal} />;

  return (
    <div className="flex flex-col gap-4">
      <ArticleLayout>
        <h2 className="text-2xl font-bold text-primary">{t("nav.overlays")}</h2>
        <p className="opacity-70">{t("nav.overlaysText")}</p>
      </ArticleLayout>

      <ContentLayout className="flex flex-wrap items-center gap-2">
        <TypeButton icon="AppWindow" label={t("demo.openModal")} onPress={openModal} />
        <TypeButton action="secondary" icon="PanelRightOpen" label={t("demo.openDrawerEnd")} onPress={openDrawerEnd} />
        <TypeButton action="secondary" isOutline icon="PanelLeftOpen" label={t("demo.openDrawerStart")} onPress={openDrawerStart} />
        <TypeButton action="error" icon="Trash2" label={t("demo.openConfirm")} onPress={openConfirm} />
        <TypeDropdown label={t("demo.actions")} items={actionItems} onSelect={handleActionSelect} />
        <span className="text-sm opacity-70">{lastAction.value}</span>
      </ContentLayout>

      <ContentLayout className="flex flex-wrap items-center gap-2">
        <TypeButton action="info" size="sm" label="info" dataValue="info" onPress={handleToastClick} />
        <TypeButton action="success" size="sm" label="success" dataValue="success" onPress={handleToastClick} />
        <TypeButton action="warning" size="sm" label="warning" dataValue="warning" onPress={handleToastClick} />
        <TypeButton action="error" size="sm" label="error" dataValue="error" onPress={handleToastClick} />
        <span className="mx-2 opacity-40">|</span>
        <TypeIcon name="Star" size={20} className="text-warning" />
        <TypeIcon name="Pencil" title={t("demo.openModal")} onPress={openModal} />
        <TypeIcon name="Trash2" title={t("demo.disabled")} onPress={openConfirm} disabled />
      </ContentLayout>

      <TypeModal isOpen={isModalOpen.value} title={t("demo.modalTitle")} onClose={closeModal} footer={modalFooter}>
        <p>{t("demo.modalText")}</p>
      </TypeModal>
      <TypeDrawer
        isOpen={side !== ""}
        side={side === "start" ? "start" : "end"}
        size="md"
        title={t("demo.drawerTitle")}
        subTitle={t("demo.drawerSubTitle")}
        onClose={closeDrawer}
      >
        <p>{t("demo.drawerText")}</p>
      </TypeDrawer>
      <TypeConfirm
        isOpen={isConfirmOpen.value}
        title={t("demo.confirmTitle")}
        message={t("demo.confirmText")}
        tone="error"
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
